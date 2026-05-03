import { callAiApi, callAiCli, callAiLocal } from './call';
import { extractJson } from './parse-json';
import { getAiMode, getReasoningModel } from '../queries/compass';
import { getModel } from './client';
import type { RoleEntry } from './slim-book';

const SYSTEM_PROMPT = `You are filtering a person's career history for relevance to a single job posting.

You'll receive:
- A numbered list of the person's roles (index, title · company, dates)
- The text of a job posting

Pick which roles are relevant to scoring this posting. A role is relevant if it demonstrates a skill, exposure, domain, or context the posting cares about — even if the role is old. Recency does NOT determine relevance.

Be inclusive. If you're not sure, include it. Default to 5–8 roles unless the person has fewer total. If all roles seem relevant, include them all.

Return ONLY JSON: { "relevant": [<indices>] }
Indices are zero-based, matching the numbered list.`;

const POSTING_CHAR_CAP = 4000;

export interface SelectorResult {
  indices: number[];
  cost: number;
  model: string;
}

/**
 * Decide which roles in the user's career history are relevant to a given
 * posting. Used as a pre-pass before scoring on CLI/local backends, where
 * the full Book would otherwise blow past the model's effective working
 * size and cause timeouts.
 *
 * Trivially returns all indices when there are 5 or fewer roles — a Book
 * that small is below the worth-trimming threshold. Also returns all
 * indices on parse failure as a graceful fallback (better to score with the
 * full Book than to fail).
 */
export async function selectRelevantRoleIndices(
  postingText: string,
  roles: RoleEntry[],
): Promise<SelectorResult> {
  if (roles.length === 0) {
    return { indices: [], cost: 0, model: '' };
  }
  if (roles.length <= 5) {
    return { indices: roles.map((r) => r.index), cost: 0, model: '' };
  }

  const mode = getAiMode();
  const userPrompt = [
    '=== ROLES ===',
    ...roles.map((r) => `[${r.index}] ${r.heading} (${r.dates})`),
    '',
    '=== POSTING ===',
    postingText.slice(0, POSTING_CHAR_CAP),
    '',
    'Return ONLY JSON: { "relevant": [...] }',
  ].join('\n');

  let raw: string;
  let cost = 0;
  let usedModel = '';

  try {
    if (mode === 'cli') {
      const r = await callAiCli({
        operation: 'select_relevant_roles',
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        context: { type: 'role' },
      });
      raw = r.text;
      cost = r.cost;
      usedModel = r.model;
    } else if (mode === 'local') {
      const r = await callAiLocal({
        operation: 'select_relevant_roles',
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.1,
        maxTokens: 256,
        context: { type: 'role' },
      });
      raw = r.text;
      cost = r.cost;
      usedModel = r.model;
    } else {
      const r = await callAiApi({
        operation: 'select_relevant_roles',
        model: getReasoningModel() || getModel(),
        maxTokens: 256,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
        context: { type: 'role' },
      });
      raw = r.text;
      cost = r.cost;
      usedModel = r.model;
    }
  } catch (err) {
    // Selector failure shouldn't block scoring. Fall back to "all roles."
    console.warn('[selectRelevantRoleIndices] failed, falling back to all roles:', err);
    return { indices: roles.map((r) => r.index), cost: 0, model: '' };
  }

  const parsed = extractJson<{ relevant: number[] }>(raw);
  if (!parsed || !Array.isArray(parsed.relevant)) {
    console.warn('[selectRelevantRoleIndices] malformed response, using all roles');
    return { indices: roles.map((r) => r.index), cost, model: usedModel };
  }

  const validIdx = new Set(roles.map((r) => r.index));
  const filtered = parsed.relevant.filter((i) => validIdx.has(i));
  // If model returned an empty array, treat as "didn't decide" and use all
  // — better to over-include than to score against an empty Book.
  return {
    indices: filtered.length > 0 ? filtered : roles.map((r) => r.index),
    cost,
    model: usedModel,
  };
}
