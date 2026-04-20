import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import type { AiScores } from '@/lib/types';

const SCHEMA_PATH = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

/** Create a fresh in-memory SQLite database with the full schema loaded. */
export function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(schema);
  return db;
}

/** Seed compass_config with sensible defaults. */
export function seedCompassConfig(db: Database.Database, overrides?: {
  signal_words?: string[];
  red_flag_words?: string[];
  compensation_floor?: number;
}): void {
  db.prepare(`
    INSERT OR REPLACE INTO compass_config (id, signal_words, red_flag_words, compensation_floor, updated_at)
    VALUES (1, ?, ?, ?, datetime('now'))
  `).run(
    JSON.stringify(overrides?.signal_words ?? ['creative technology', 'design systems']),
    JSON.stringify(overrides?.red_flag_words ?? ['blockchain', '10x ninja']),
    overrides?.compensation_floor ?? 150000,
  );
}

/** Build a valid AiScores object for test insertions. */
export function makeAiScores(overrides?: Partial<AiScores>): AiScores {
  return {
    want: { score: 2, rationale: 'test' },
    can: { score: 2, rationale: 'test' },
    grow: { score: 2, rationale: 'test' },
    pay: { score: 2, rationale: 'test' },
    team: { score: 2, rationale: 'test' },
    impact: { score: 2, rationale: 'test' },
    ...overrides,
  };
}
