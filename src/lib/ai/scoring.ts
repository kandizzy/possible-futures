import { getModel } from './client';
import { callAiApi, callAiCli, callAiLocal, type LogContext } from './call';
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
): Promise<ScoringResponse> {
  const mode = modeOverride || getAiMode();

  let rawResponse: string;

  if (mode === 'cli') {
    const result = await callAiCli({
      operation: 'score_posting',
      systemPrompt: getScoringSystemPrompt(),
      userPrompt: buildScoringUserPrompt(postingText),
      context,
    });
    rawResponse = result.text;
  } else if (mode === 'local') {
    const result = await callAiLocal({
      operation: 'score_posting',
      systemPrompt: getScoringSystemPrompt(),
      userPrompt: buildScoringUserPrompt(postingText),
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
              text: buildScoringVolatileSuffix(postingText),
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
