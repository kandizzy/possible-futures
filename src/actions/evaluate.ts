'use server';

import { scorePosting } from '@/lib/ai/scoring';
import { fetchPostingText } from '@/lib/parsers/posting';
import { insertRole } from '@/lib/queries/roles';
import type { ScoringResponse } from '@/lib/types';

export interface EvaluateResult {
  success: boolean;
  roleId?: number;
  scoring?: ScoringResponse;
  error?: string;
}

export async function evaluatePosting(formData: FormData): Promise<EvaluateResult> {
  const url = (formData.get('url') as string)?.trim() || '';
  const pastedText = (formData.get('posting_text') as string)?.trim() || '';

  if (!url && !pastedText) {
    return { success: false, error: 'Provide a URL or paste the job posting text.' };
  }

  let postingText = pastedText;

  // If URL provided and no pasted text, try fetching
  if (url && !pastedText) {
    try {
      postingText = await fetchPostingText(url);
      if (postingText.length < 100) {
        return {
          success: false,
          error: 'Fetched page had very little text content. This site may require JavaScript. Try pasting the posting text instead.',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: `Could not fetch URL: ${err instanceof Error ? err.message : 'Unknown error'}. Try pasting the posting text instead.`,
      };
    }
  }

  // Score with AI
  try {
    const scoring = await scorePosting(postingText, undefined, undefined, url || undefined);

    // Save to database
    const roleId = insertRole({
      title: scoring.role_title || 'Untitled Role',
      company: scoring.company || 'Unknown Company',
      url: url || undefined,
      posting_text: postingText,
      salary_range: scoring.salary_range || undefined,
      location: scoring.location || undefined,
      ai_scores: scoring.scores,
      ai_recommendation: scoring.recommendation,
      recommended_resume_version: scoring.recommended_resume_version,
      signal_words_found: scoring.signal_words_found,
      red_flags_found: scoring.red_flags_found,
      fit_summary: scoring.fit_summary,
      gap_analysis: scoring.gap_analysis,
    });

    return { success: true, roleId, scoring };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('ANTHROPIC_API_KEY')) {
      return { success: false, error: 'ANTHROPIC_API_KEY not set. Add it to .env.local and restart the dev server.' };
    }
    return { success: false, error: `Scoring failed: ${message}` };
  }
}
