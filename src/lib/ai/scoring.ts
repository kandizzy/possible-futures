import { getModel } from './client';
import { callAiApi, callAiCli, callAiLocal, type LogContext } from './call';
import { extractRoleList, buildSlimBook } from './slim-book';
import { selectRelevantRoleIndices } from './select-relevant-roles';
import { getSourceFile } from '../queries/source-files';
import {
  getScoringSystemPrompt,
  buildScoringUserPrompt,
  buildScoringStablePrefix,
  buildScoringVolatileSuffix,
} from './prompts';
import { extractJson } from './parse-json';
import { getAiMode } from '../queries/compass';
import type { ScoringResponse, AiMode } from '../types';

export function parseScoringResponse(raw: string): ScoringResponse {
  const parsed = extractJson<ScoringResponse>(raw);

  if (!parsed.scores || !parsed.recommendation || !parsed.fit_summary) {
    throw new Error('Response missing required fields (scores, recommendation, or fit_summary)');
  }

  // Default gap_analysis to empty array if not present
  if (!parsed.gap_analysis) {
    parsed.gap_analysis = [];
  }

  // Recalculate total from actual scores
  const dims = ['want', 'can', 'grow', 'pay', 'team', 'impact'] as const;
  parsed.total = dims.reduce((sum, d) => sum + (parsed.scores[d]?.score || 0), 0);

  return parsed;
}

export async function scorePosting(
  postingText: string,
  modeOverride?: AiMode,
  context?: LogContext,
  url?: string | null,
): Promise<ScoringResponse> {
  const mode = modeOverride || getAiMode();

  let rawResponse: string;

  // For CLI/local modes the full Book can blow past the model's effective
  // working size and time out. Run a quick selector pass first to pick
  // which roles are actually relevant to this posting, then build a slim
  // Book containing only those. API mode skips this — its prompt cache
  // makes the full Book essentially free after the first call, and a
  // slim Book would invalidate the cache.
  let bookOverride: string | undefined;
  if (mode === 'cli' || mode === 'local') {
    const fullBook = getSourceFile('PROJECT_BOOK')?.content;
    if (fullBook) {
      const roles = extractRoleList(fullBook);
      if (roles.length > 5) {
        const sel = await selectRelevantRoleIndices(postingText, roles);
        bookOverride = buildSlimBook(fullBook, sel.indices);
      }
    }
  }

  if (mode === 'cli') {
    const result = await callAiCli({
      operation: 'score_posting',
      systemPrompt: getScoringSystemPrompt(),
      userPrompt: buildScoringUserPrompt(postingText, url, { bookOverride }),
      context,
    });
    rawResponse = result.text;
  } else if (mode === 'local') {
    const result = await callAiLocal({
      operation: 'score_posting',
      systemPrompt: getScoringSystemPrompt(),
      userPrompt: buildScoringUserPrompt(postingText, url, { bookOverride }),
      temperature: 0.2,
      maxTokens: 4096,
      context,
    });
    rawResponse = result.text;
  } else {
    // The stable prefix (Compass + Book + Playbook + calibrations + schema) is
    // marked with cache_control: ephemeral so the next scoring call within 5
    // minutes reads it at 0.1x input cost. This is how a 20-posting discovery
    // run stays under a dollar.
    const result = await callAiApi({
      operation: 'score_posting',
      model: getModel(),
      maxTokens: 4096,
      system: getScoringSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildScoringStablePrefix(),
              cache_control: { type: 'ephemeral' },
            },
            {
              type: 'text',
              text: buildScoringVolatileSuffix(postingText, url),
            },
          ],
        },
      ],
      context,
    });
    rawResponse = result.text;
  }

  return parseScoringResponse(rawResponse);
}
