'use server';

import { revalidatePath } from 'next/cache';
import path from 'path';
import fs from 'fs';
import {
  getOnboardingDraft,
  saveOnboardingDraft,
  markOnboardingComplete,
} from '@/lib/queries/onboarding';
import { upsertSourceFile } from '@/lib/queries/source-files';
import { upsertCompassConfig } from '@/lib/queries/compass';
import { parseCompass } from '@/lib/parsers/compass';
import { compileIntake } from '@/lib/onboarding/compile';
import { deriveBookFilename } from '@/lib/user-name';
import type { IntakeAnswers, IntakeChapter } from '@/lib/types';

/** Save progress without leaving the chapter. Used by autosave and next/back buttons. */
export async function saveIntakeProgress(formData: FormData): Promise<
  { success: true } | { success: false; error: string }
> {
  const chapterRaw = formData.get('chapter');
  const answersRaw = formData.get('answers');

  if (typeof chapterRaw !== 'string' || typeof answersRaw !== 'string') {
    return { success: false, error: 'Missing chapter or answers.' };
  }

  const chapter = Number(chapterRaw);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 5) {
    return { success: false, error: 'Invalid chapter number.' };
  }

  let parsed: IntakeAnswers;
  try {
    parsed = JSON.parse(answersRaw);
  } catch {
    return { success: false, error: 'Invalid answers JSON.' };
  }

  saveOnboardingDraft(parsed, chapter as IntakeChapter);
  return { success: true };
}

/**
 * Compile the current draft into Book / Compass / Playbook markdown, write them
 * to the source_files table, populate compass_config via the existing parser,
 * attempt to write the files to disk in the parent directory, and mark
 * onboarding complete.
 */
export async function publishIntake(): Promise<
  { success: true; diskPaths?: string[]; diskError?: string } | { success: false; error: string }
> {
  const draft = getOnboardingDraft();

  if (!draft.answers.name || !draft.answers.through_line) {
    return { success: false, error: 'Please finish Chapter I before publishing.' };
  }

  const { book, compass, playbook } = compileIntake(draft.answers);

  // Source files — use the same filenames the app already expects
  upsertSourceFile('PROJECT_BOOK', book);
  upsertSourceFile('JOB_SEARCH_COMPASS.md', compass);
  upsertSourceFile('APPLICATION_PLAYBOOK.md', playbook);

  // Populate compass_config via the existing parser
  try {
    const parsed = parseCompass(compass);
    upsertCompassConfig({
      signal_words: parsed.signal_words,
      red_flag_words: parsed.red_flag_words,
      compensation_floor: parsed.compensation_floor,
    });
  } catch (err) {
    return {
      success: false,
      error: `Compass parsing failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Write to disk. In sandbox mode, write to data/sandbox-output/ to avoid
  // overwriting real files in the parent directory. In production mode, write
  // to the parent directory where the user's resume workspace lives.
  let diskPaths: string[] = [];
  let diskError: string | undefined;
  const isSandbox = (process.env.DB_FILE || '').includes('sandbox');
  try {
    const RESUME_DIR = isSandbox
      ? path.join(process.cwd(), 'data', 'sandbox-output')
      : path.resolve(process.cwd(), '..');
    if (!fs.existsSync(RESUME_DIR)) {
      fs.mkdirSync(RESUME_DIR, { recursive: true });
    }
    const bookFilename = process.env.PROJECT_BOOK || deriveBookFilename(draft.answers.name);

    const targets: Array<[string, string]> = [
      [path.join(RESUME_DIR, bookFilename), book],
      [path.join(RESUME_DIR, 'JOB_SEARCH_COMPASS.md'), compass],
      [path.join(RESUME_DIR, 'APPLICATION_PLAYBOOK.md'), playbook],
    ];

    for (const [target, contents] of targets) {
      fs.writeFileSync(target, contents, 'utf-8');
      if (!isSandbox) diskPaths.push(target);
    }
  } catch (err) {
    diskError = err instanceof Error ? err.message : String(err);
    diskPaths = [];
  }

  markOnboardingComplete('intake');

  revalidatePath('/');
  revalidatePath('/settings');

  return { success: true, diskPaths, diskError };
}
