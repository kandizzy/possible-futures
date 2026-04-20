import { getDb } from '../db';
import {
  parseContactFromBook,
  parseEducationFromBook,
  parseThroughLine,
  parseRolesFromBook,
  parseProjectsFromBook,
  parseVersionsFromBook,
  parseSensitiveContext,
  parseRecognition,
  parseScoringContext,
} from '../parsers/book';
import type { IntakeAnswers, IntakeChapter, OnboardingDraft, OnboardingState } from '../types';

interface DraftRow {
  id: number;
  answers: string;
  current_chapter: number;
  updated_at: string;
}

interface StateRow {
  id: number;
  completed_at: string | null;
  published_by: string | null;
  ritual_acknowledged_at: string | null;
  revision_count: number;
}

export function getOnboardingDraft(): OnboardingDraft {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM onboarding_draft WHERE id = 1')
    .get() as DraftRow | undefined;

  // If source files exist, parse them for any fields the draft is missing.
  // This handles both "no draft at all" and "partial draft from earlier visit."
  const fileCount = db.prepare('SELECT COUNT(*) as c FROM source_files').get() as { c: number };
  const fromFiles = fileCount.c > 0 ? buildDraftFromExistingData(db) : null;

  if (row) {
    let parsed: IntakeAnswers = {};
    try {
      parsed = JSON.parse(row.answers);
    } catch {
      parsed = {};
    }
    // Backfill empty fields from source files
    if (fromFiles) {
      for (const [key, value] of Object.entries(fromFiles)) {
        const k = key as keyof IntakeAnswers;
        if (parsed[k] === undefined || parsed[k] === null || parsed[k] === '') {
          (parsed as Record<string, unknown>)[k] = value;
        }
        // Also backfill empty arrays
        if (Array.isArray(parsed[k]) && (parsed[k] as unknown[]).length === 0 && Array.isArray(value) && value.length > 0) {
          (parsed as Record<string, unknown>)[k] = value;
        }
      }
    }
    return {
      answers: parsed,
      current_chapter: Math.min(Math.max(row.current_chapter, 1), 5) as IntakeChapter,
      updated_at: row.updated_at,
    };
  }

  if (fromFiles) {
    return {
      answers: fromFiles,
      current_chapter: 1,
      updated_at: new Date().toISOString(),
    };
  }

  return {
    answers: {},
    current_chapter: 1,
    updated_at: new Date().toISOString(),
  };
}

function buildDraftFromExistingData(db: ReturnType<typeof getDb>): IntakeAnswers {
  const answers: IntakeAnswers = {};

  // Pull structured data from compass_config
  const config = db.prepare('SELECT * FROM compass_config WHERE id = 1').get() as {
    signal_words: string;
    red_flag_words: string;
    compensation_floor: number;
  } | undefined;

  if (config) {
    try { answers.signal_words = JSON.parse(config.signal_words); } catch {}
    try { answers.red_flag_words = JSON.parse(config.red_flag_words); } catch {}
    answers.compensation_floor = config.compensation_floor;
  }

  // Parse the Book for everything else
  const book = db.prepare("SELECT content FROM source_files WHERE filename = 'PROJECT_BOOK'").get() as { content: string } | undefined;
  if (book?.content) {
    const content = book.content;

    // Contact
    Object.assign(answers, parseContactFromBook(content));

    // Education
    const education = parseEducationFromBook(content);
    if (education.length > 0) answers.education = education;

    // Through-line
    const throughLine = parseThroughLine(content);
    if (throughLine) answers.through_line = throughLine;

    // Scoring context (dream role, current situation)
    Object.assign(answers, parseScoringContext(content));

    // Roles with full body content
    const roles = parseRolesFromBook(content);
    if (roles.length > 0) answers.roles = roles;

    // Projects
    const projects = parseProjectsFromBook(content);
    if (projects.length > 0) answers.projects = projects;

    // Versions
    const versions = parseVersionsFromBook(content);
    if (versions.length > 0) answers.versions = versions;

    // Sensitive context
    const sensitive = parseSensitiveContext(content);
    if (sensitive) answers.sensitive_context = sensitive;

    // Recognition
    const recognition = parseRecognition(content);
    if (recognition.length > 0) answers.recognition = recognition;
  }

  return answers;
}

export function saveOnboardingDraft(answers: IntakeAnswers, chapter: IntakeChapter): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO onboarding_draft (id, answers, current_chapter, updated_at)
     VALUES (1, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       answers = excluded.answers,
       current_chapter = excluded.current_chapter,
       updated_at = datetime('now')`,
  ).run(JSON.stringify(answers), chapter);
}

export function clearOnboardingDraft(): void {
  const db = getDb();
  db.prepare('DELETE FROM onboarding_draft WHERE id = 1').run();
}

export function getOnboardingState(): OnboardingState {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM onboarding_state WHERE id = 1')
    .get() as StateRow | undefined;

  if (!row) {
    return { completed_at: null, published_by: null, ritual_acknowledged_at: null, revision_count: 0 };
  }

  return {
    completed_at: row.completed_at,
    published_by: (row.published_by as OnboardingState['published_by']) ?? null,
    ritual_acknowledged_at: row.ritual_acknowledged_at,
    revision_count: row.revision_count || 1,
  };
}

export function isRitualAcknowledged(): boolean {
  const state = getOnboardingState();
  return state.ritual_acknowledged_at !== null;
}

export function markRitualAcknowledged(): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO onboarding_state (id, completed_at, published_by, ritual_acknowledged_at)
     VALUES (1, NULL, NULL, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       ritual_acknowledged_at = datetime('now')`,
  ).run();
}

export function markOnboardingComplete(publishedBy: 'intake' | 'seed' | 'manual'): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO onboarding_state (id, completed_at, published_by, revision_count)
     VALUES (1, datetime('now'), ?, 1)
     ON CONFLICT(id) DO UPDATE SET
       completed_at = datetime('now'),
       published_by = excluded.published_by,
       revision_count = COALESCE(onboarding_state.revision_count, 0) + 1`,
  ).run(publishedBy);
}

/**
 * True when the app has never been seeded or onboarded — no source files loaded
 * AND no onboarding completion marker. Used to route first-time visitors to /onboarding.
 */
export function isFirstRun(): boolean {
  const db = getDb();
  const state = getOnboardingState();
  if (state.completed_at) return false;

  const fileCount = db
    .prepare('SELECT COUNT(*) as c FROM source_files')
    .get() as { c: number };
  return fileCount.c === 0;
}
