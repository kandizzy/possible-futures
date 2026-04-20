import { getCompassConfig } from '../queries/compass';
import { getOnboardingDraft, getOnboardingState, isFirstRun } from '../queries/onboarding';
import { getSourceFile } from '../queries/source-files';
import { extractNameFromBook } from '../user-name';
import type { IntakeRole } from '../types';

export interface CompassReadiness {
  ready: boolean;
  missing: string[];
}

function isCompleteRole(role: IntakeRole | undefined): boolean {
  if (!role) return false;
  const isCompressed = /previous experience|multiple/i.test((role.title || '') + (role.company || ''));
  return Boolean(
    role.title?.trim() &&
      role.company?.trim() &&
      role.summary?.trim() &&
      (role.proudest?.trim() || isCompressed),
  );
}

/**
 * Whether the compass has enough human-written content for downstream features
 * (Discovery, scoring) to produce non-garbage results. Checked in two places:
 *
 * 1. Route guards — /discover redirects to /onboarding if not ready
 * 2. UI affordances — disable "Suggest companies" buttons until ready
 *
 * The rules are intentionally strict: three fully-populated roles, real signal
 * words, a real compensation floor. Anything less than this and Claude has
 * nothing to reason about.
 */
export function getCompassReadiness(): CompassReadiness {
  const missing: string[] = [];

  // Returning users (already have source files + a real Book) are grandfathered:
  // their compass lives in the source_files rows they loaded via seed, not in
  // the onboarding_draft table the intake writes to. Check the source files
  // directly and skip the intake-draft checks for them.
  if (!isFirstRun()) {
    const book = getSourceFile('PROJECT_BOOK');
    const bookName = extractNameFromBook(book?.content);
    if (!book || !bookName) {
      missing.push('Load your Book with a proper H1 (run the seed script or finish the intake).');
    }

    const config = getCompassConfig();
    if (!config || config.signal_words.length < 3) {
      missing.push('Add at least 3 signal words to the compass.');
    }
    if (!config || config.red_flag_words.length < 1) {
      missing.push('Add at least 1 red flag word to the compass.');
    }
    if (!config || config.compensation_floor == null) {
      missing.push('Set a compensation floor.');
    }

    return { ready: missing.length === 0, missing };
  }

  // First-run path: gate on the intake state directly.
  const state = getOnboardingState();
  if (!state.ritual_acknowledged_at) {
    missing.push('Complete the ritual acknowledgment at /begin.');
  }

  const draft = getOnboardingDraft();
  const answers = draft.answers;

  if (!answers.name?.trim()) {
    missing.push('Set your name in Chapter I.');
  }
  if (!answers.through_line?.trim()) {
    missing.push('Write a through-line in Chapter I.');
  }

  const roles = answers.roles ?? [];
  const completeRoles = roles.filter(isCompleteRole);
  if (completeRoles.length < 2) {
    missing.push(
      `Add ${2 - completeRoles.length} more complete role${
        2 - completeRoles.length === 1 ? '' : 's'
      } in Chapter II (title, company, summary, and proudest-moment).`,
    );
  }

  const config = getCompassConfig();
  if (!config || config.signal_words.length < 3) {
    missing.push('Add at least 3 signal words in Chapter III.');
  }
  if (!config || config.red_flag_words.length < 1) {
    missing.push('Add at least 1 red flag word in Chapter IV.');
  }
  if (!config || config.compensation_floor == null) {
    missing.push('Set a compensation floor in Chapter III.');
  }

  return {
    ready: missing.length === 0,
    missing,
  };
}

export function isCompassReady(): boolean {
  return getCompassReadiness().ready;
}
