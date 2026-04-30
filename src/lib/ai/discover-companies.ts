import { callAiApi, callAiCli, callAiLocal } from './call';
import { extractJson } from './parse-json';
import { getSourceFile } from '../queries/source-files';
import {
  getTrackedCompanyNames,
  getSkippedCompanyNames,
} from '../queries/companies';
import { getAlreadySuggestedNames } from '../queries/discovery';
import { getAiMode, getReasoningModel } from '../queries/compass';
import type { AtsProvider } from '../types';

export interface SuggestedCompany {
  name: string;
  category: string;
  why_fits: string;
  guessed_ats_provider: AtsProvider | null;
  guessed_ats_slug: string | null;
  careers_url: string | null;
}

interface SuggestionsResponse {
  suggestions: SuggestedCompany[];
}

const SYSTEM_PROMPT = `You are a career research assistant with deep knowledge of which companies are known to hire design engineers, creative technologists, and similar interdisciplinary roles. You read a person's career compass and suggest companies that match their signal words and values.

Rules:
- Only suggest companies you are confident actually exist and hire people like this.
- Prefer companies that ship polished products with strong design cultures.
- Don't suggest companies already in the user's tracked or skipped list.
- For each suggestion, guess the ATS provider and the likely slug. The app verifies these live, so it's OK to guess — but be thoughtful. If you genuinely don't know, return null.
- Available providers: "greenhouse", "ashby", or "workable" only. Do NOT guess "lever" — their public API is down.
- Greenhouse is the most common provider for tech companies. Ashby is popular with startups. Workable is less common but used by some mid-size companies.
- The slug is the URL path segment on the ATS board. It's often the company name lowercased with no spaces, but can be non-obvious. Examples: Anthropic on Greenhouse → "anthropic"; Figma on Greenhouse → "figma"; Notion on Ashby → "notion"; Linear on Ashby → "linear". Some companies use variants like "companyhq", "companyinc", or their domain name without TLD.
- Return ONLY valid JSON matching the schema. No markdown, no prose.`;

function buildStablePrefix(): string {
  const book = getSourceFile('PROJECT_BOOK');
  const compass = getSourceFile('JOB_SEARCH_COMPASS.md');
  const playbook = getSourceFile('APPLICATION_PLAYBOOK.md');

  const parts: string[] = [];
  parts.push('=== JOB SEARCH COMPASS ===');
  parts.push(compass?.content || '[Compass not loaded.]');
  parts.push('\n=== CAREER HISTORY (PROJECT BOOK) ===');
  parts.push(book?.content || '[Book not loaded.]');
  parts.push('\n=== APPLICATION PLAYBOOK ===');
  parts.push(playbook?.content || '[Playbook not loaded.]');
  return parts.join('\n');
}

function buildVolatileSuffix(roleType: string | undefined): string {
  const tracked = getTrackedCompanyNames();
  const skipped = getSkippedCompanyNames();
  const previouslySuggested = getAlreadySuggestedNames();
  const allExcluded = [...new Set([...tracked, ...skipped, ...previouslySuggested])];

  const parts: string[] = [];
  parts.push('\n=== DO NOT SUGGEST THESE (already tracked, skipped, or previously suggested) ===');
  parts.push(allExcluded.length > 0 ? allExcluded.join(', ') : '(none yet)');

  parts.push('\n=== WHAT TO FIND ===');
  if (roleType && roleType.trim()) {
    parts.push(`Find ~20 companies that are likely to hire for: "${roleType.trim()}"`);
    parts.push('Filter by fit to the compass above — match signal words, avoid red flag words.');
  } else {
    parts.push('Find ~20 companies that best fit this compass. Use the signal words and dream-role hints to rank.');
  }

  parts.push(`
Return JSON in exactly this shape (no code fences, no prose):
{
  "suggestions": [
    {
      "name": "Company Name",
      "category": "short category label like 'AI tooling' or 'Design tools'",
      "why_fits": "One sentence citing specific signal words from the compass.",
      "guessed_ats_provider": "greenhouse" | "ashby" | "workable" | null,
      "guessed_ats_slug": "companyname" | null,
      "careers_url": "https://..." | null
    }
  ]
}`);

  return parts.join('\n');
}

function buildFullUserPrompt(roleType: string | undefined): string {
  return buildStablePrefix() + buildVolatileSuffix(roleType);
}

export async function discoverCompanies(options: {
  roleType?: string;
  modelOverride?: string;
}): Promise<{ suggestions: SuggestedCompany[]; cost: number; model: string }> {
  const mode = getAiMode();
  const model = options.modelOverride || getReasoningModel();

  let raw: string;
  let cost = 0;
  let usedModel = model;

  if (mode === 'cli') {
    const result = await callAiCli({
      operation: 'discover_companies',
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildFullUserPrompt(options.roleType),
      context: { type: 'discovery_search' },
    });
    raw = result.text;
    cost = result.cost;
    usedModel = result.model;
  } else if (mode === 'local') {
    const result = await callAiLocal({
      operation: 'discover_companies',
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildFullUserPrompt(options.roleType),
      temperature: 0.5,
      maxTokens: 4096,
      context: { type: 'discovery_search' },
    });
    raw = result.text;
    cost = result.cost;
    usedModel = result.model;
  } else {
    const result = await callAiApi({
      operation: 'discover_companies',
      model,
      maxTokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildStablePrefix(),
              cache_control: { type: 'ephemeral' },
            },
            {
              type: 'text',
              text: buildVolatileSuffix(options.roleType),
            },
          ],
        },
      ],
      context: { type: 'discovery_search' },
    });
    raw = result.text;
    cost = result.cost;
    usedModel = result.model;
  }

  const parsed = extractJson<SuggestionsResponse>(raw);
  if (!parsed || !Array.isArray(parsed.suggestions)) {
    throw new Error('Suggestions response missing a "suggestions" array');
  }

  const cleaned: SuggestedCompany[] = parsed.suggestions
    .filter((s) => s && typeof s.name === 'string' && s.name.trim())
    .map((s) => ({
      name: s.name.trim(),
      category: (s.category || '').trim(),
      why_fits: (s.why_fits || '').trim(),
      guessed_ats_provider:
        s.guessed_ats_provider &&
        ['greenhouse', 'lever', 'ashby', 'workable'].includes(s.guessed_ats_provider)
          ? (s.guessed_ats_provider as AtsProvider)
          : null,
      guessed_ats_slug: s.guessed_ats_slug?.trim() || null,
      careers_url: s.careers_url?.trim() || null,
    }));

  return { suggestions: cleaned, cost, model: usedModel };
}
