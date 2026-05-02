import { callAiApi, callAiCli, callAiLocal } from './call';
import { extractJson } from './parse-json';
import { getSourceFile } from '../queries/source-files';
import { getAiMode, getReasoningModel } from '../queries/compass';

export interface GroundingCandidate {
  name: string;
  postings: { title: string; text: string }[];
}

export interface GroundingResult {
  name: string;
  why_fits: string | null;
}

/**
 * Cap one posting's contribution to the grounding prompt. Most postings
 * have a lot of boilerplate (legal text, perks list); the first ~800 chars
 * usually contain the role description and company framing that actually
 * indicate fit.
 */
const POSTING_TEXT_CAP = 800;
/** Cap how many postings per company we include — no need to send all 50. */
const POSTINGS_PER_COMPANY = 3;

const SYSTEM_PROMPT = `You are a company-fit verifier. You receive a person's career compass and a list of candidate companies, each with the actual text of their recent job postings. Your job: decide whether each company's *current* postings genuinely match the compass — and if so, write a one-sentence why_fits that cites a SPECIFIC detail from the postings (a phrase, a role title, a stack, a focus area).

Rules:
- Ground every why_fits in the posting text. If it isn't supported by what the postings actually say, return null. Don't manufacture fit.
- Quote or paraphrase a real signal: "their open Frontend Engineer roles emphasize prototype velocity and Figma-to-code fidelity" beats "creative platform with strong design culture."
- A company can be a fit even if not every posting matches — find the strongest connection. But if NONE of the postings relate to the compass signal_words, dream role, or H3 destination, return null.
- A company that's clearly hiring for a different domain (e.g., postings are all sales/ops when the compass is about engineering) should return null.
- One sentence max per why_fits. Plain prose, no markdown.
- Return ONLY valid JSON: { "results": [{ "name": "...", "why_fits": "..." | null }, ...] }`;

function buildCompassExcerpt(): string {
  const compass = getSourceFile('JOB_SEARCH_COMPASS.md');
  // Send the whole compass; it's not that big and it's the source of truth
  // for what counts as fit.
  return compass?.content || '[Compass not loaded.]';
}

function buildCandidatesBlock(candidates: GroundingCandidate[]): string {
  const parts: string[] = [];
  candidates.forEach((c, i) => {
    parts.push(`\n--- Candidate ${i + 1}: ${c.name} ---`);
    if (c.postings.length === 0) {
      parts.push('(no postings fetched — return null)');
      return;
    }
    c.postings.slice(0, POSTINGS_PER_COMPANY).forEach((p, j) => {
      const text = (p.text || '').slice(0, POSTING_TEXT_CAP).replace(/\s+/g, ' ').trim();
      parts.push(`Posting ${j + 1}: ${p.title}`);
      parts.push(text || '(empty)');
    });
  });
  return parts.join('\n');
}

function buildUserPrompt(candidates: GroundingCandidate[]): string {
  return [
    '=== COMPASS ===',
    buildCompassExcerpt(),
    '\n=== CANDIDATES ===',
    buildCandidatesBlock(candidates),
    '\n=== TASK ===',
    'For each candidate, return a why_fits string grounded in the posting text, or null if the postings don\'t actually match the compass. Output JSON: { "results": [{ "name": "<exact name as given>", "why_fits": "..." | null }, ...] }',
  ].join('\n');
}

/**
 * Ground each suggestion's rationale in real posting text. Returns one entry
 * per input candidate; entries with `why_fits === null` should be dropped
 * from results before showing to the user.
 */
export async function groundSuggestionRationales(
  candidates: GroundingCandidate[],
): Promise<{ results: GroundingResult[]; cost: number; model: string }> {
  if (candidates.length === 0) {
    return { results: [], cost: 0, model: '' };
  }

  const mode = getAiMode();
  const model = getReasoningModel();
  const userPrompt = buildUserPrompt(candidates);

  let raw: string;
  let cost = 0;
  let usedModel = model;

  if (mode === 'cli') {
    const result = await callAiCli({
      operation: 'ground_suggestions',
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      context: { type: 'discovery_search' },
    });
    raw = result.text;
    cost = result.cost;
    usedModel = result.model;
  } else if (mode === 'local') {
    const result = await callAiLocal({
      operation: 'ground_suggestions',
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.2,
      maxTokens: 4096,
      context: { type: 'discovery_search' },
    });
    raw = result.text;
    cost = result.cost;
    usedModel = result.model;
  } else {
    const result = await callAiApi({
      operation: 'ground_suggestions',
      model,
      maxTokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      context: { type: 'discovery_search' },
    });
    raw = result.text;
    cost = result.cost;
    usedModel = result.model;
  }

  const parsed = extractJson<{ results: GroundingResult[] }>(raw);
  if (!parsed || !Array.isArray(parsed.results)) {
    throw new Error('Grounding response missing a "results" array');
  }

  // Match the order of input candidates, falling back to null if the model
  // skipped one. We trust input names as canonical and look them up in the
  // model's response, since the model occasionally returns a different
  // capitalization or formatting.
  const byName = new Map<string, GroundingResult>();
  for (const r of parsed.results) {
    if (r && typeof r.name === 'string') {
      byName.set(r.name.trim().toLowerCase(), {
        name: r.name.trim(),
        why_fits: typeof r.why_fits === 'string' && r.why_fits.trim() ? r.why_fits.trim() : null,
      });
    }
  }

  const results: GroundingResult[] = candidates.map((c) => {
    const found = byName.get(c.name.trim().toLowerCase());
    return found ?? { name: c.name, why_fits: null };
  });

  return { results, cost, model: usedModel };
}
