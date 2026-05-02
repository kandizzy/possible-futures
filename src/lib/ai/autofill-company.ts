import { callAiApi, callAiCli, callAiLocal } from './call';
import { extractJson } from './parse-json';
import { getAiMode, getReasoningModel } from '../queries/compass';
import type { AtsProvider } from '../types';

export interface AutofilledCompany {
  category: string | null;
  why_interested: string | null;
  careers_url: string | null;
  guessed_ats_provider: AtsProvider | null;
  guessed_ats_slug: string | null;
}

const SYSTEM_PROMPT = `You are a research assistant filling out a company watchlist entry. The user gives you a company name (and optionally a hint URL). You return JSON with a short category label, a one-sentence "why interesting" hook, the canonical careers page URL, and a best-guess ATS provider/slug.

Rules:
- Be terse. Category is 2-4 words ("Design tools", "AI research lab", "Aerospace engineering").
- why_interested is one short sentence framing the company's distinguishing trait — what they ship, what culture is known for. NOT generic hype.
- careers_url should be the company's actual careers landing page if you know it. Null if you don't.
- For ATS: only return one of "greenhouse", "ashby", "workable" if you're confident. The app verifies live, so a reasonable guess is fine, but null is better than a wrong guess.
- The slug is the URL path segment on the ATS board (e.g. Anthropic on Greenhouse → "anthropic"). Lowercase, no spaces.
- If you don't recognize the company at all, return all nulls — DO NOT make things up. Fabricated descriptions are the failure mode we're trying to avoid.
- Return ONLY JSON: { "category": "...", "why_interested": "...", "careers_url": "...", "guessed_ats_provider": "...", "guessed_ats_slug": "..." }`;

function buildPrompt(name: string, hintUrl?: string): string {
  const lines: string[] = [`Company name: ${name}`];
  if (hintUrl && hintUrl.trim()) {
    lines.push(`Hint URL: ${hintUrl.trim()}`);
  }
  lines.push('\nReturn the JSON described in the system prompt.');
  return lines.join('\n');
}

/**
 * Use the configured AI backend to suggest category, why_interested,
 * careers_url, and ATS hints for a company the user is adding manually.
 * Returns all-nulls if the model doesn't recognize the company — explicitly
 * tells the model to do so rather than fabricate.
 */
export async function autofillCompanyDetails(
  name: string,
  hintUrl?: string,
): Promise<{ result: AutofilledCompany; cost: number; model: string }> {
  if (!name.trim()) {
    throw new Error('Company name is required');
  }

  const mode = getAiMode();
  const model = getReasoningModel();
  const userPrompt = buildPrompt(name, hintUrl);

  let raw: string;
  let cost = 0;
  let usedModel = model;

  if (mode === 'cli') {
    const r = await callAiCli({
      operation: 'autofill_company',
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      context: { type: 'discovery_search' },
    });
    raw = r.text;
    cost = r.cost;
    usedModel = r.model;
  } else if (mode === 'local') {
    const r = await callAiLocal({
      operation: 'autofill_company',
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.2,
      maxTokens: 512,
      context: { type: 'discovery_search' },
    });
    raw = r.text;
    cost = r.cost;
    usedModel = r.model;
  } else {
    const r = await callAiApi({
      operation: 'autofill_company',
      model,
      maxTokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      context: { type: 'discovery_search' },
    });
    raw = r.text;
    cost = r.cost;
    usedModel = r.model;
  }

  const parsed = extractJson<{
    category?: string | null;
    why_interested?: string | null;
    careers_url?: string | null;
    guessed_ats_provider?: string | null;
    guessed_ats_slug?: string | null;
  }>(raw);

  if (!parsed) {
    throw new Error('Could not parse JSON from autofill response');
  }

  const ats = parsed.guessed_ats_provider?.trim() || null;
  const validAts: AtsProvider[] = ['greenhouse', 'ashby', 'workable'];

  return {
    result: {
      category: parsed.category?.trim() || null,
      why_interested: parsed.why_interested?.trim() || null,
      careers_url: parsed.careers_url?.trim() || null,
      guessed_ats_provider: ats && (validAts as string[]).includes(ats) ? (ats as AtsProvider) : null,
      guessed_ats_slug: parsed.guessed_ats_slug?.trim() || null,
    },
    cost,
    model: usedModel,
  };
}
