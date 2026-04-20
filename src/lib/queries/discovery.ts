import { getDb } from '../db';
import type {
  AtsProvider,
  DiscoveryRun,
  DiscoveryRunStatus,
  DiscoveryLogEntry,
} from '../types';

interface RunRow {
  id: number;
  kind: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  companies_checked: number;
  postings_found: number;
  postings_new: number;
  postings_scored: number;
  current_company: string | null;
  error: string | null;
  log: string;
}

function hydrate(row: RunRow): DiscoveryRun {
  let log: DiscoveryLogEntry[] = [];
  try {
    log = JSON.parse(row.log || '[]');
  } catch {
    log = [];
  }
  return {
    id: row.id,
    kind: row.kind as DiscoveryRun['kind'],
    started_at: row.started_at,
    ended_at: row.ended_at,
    status: row.status as DiscoveryRunStatus,
    companies_checked: row.companies_checked,
    postings_found: row.postings_found,
    postings_new: row.postings_new,
    postings_scored: row.postings_scored,
    current_company: row.current_company,
    error: row.error,
    log,
  };
}

export function insertDiscoveryRun(kind: DiscoveryRun['kind'] = 'roles'): number {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO discovery_runs (kind, started_at, status)
       VALUES (?, datetime('now'), 'running')`,
    )
    .run(kind);
  return Number(result.lastInsertRowid);
}

export function getDiscoveryRun(id: number): DiscoveryRun | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM discovery_runs WHERE id = ?')
    .get(id) as RunRow | undefined;
  return row ? hydrate(row) : null;
}

export function getRecentDiscoveryRuns(limit = 20): DiscoveryRun[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM discovery_runs ORDER BY id DESC LIMIT ?')
    .all(limit) as RunRow[];
  return rows.map(hydrate);
}

export function getActiveDiscoveryRun(): DiscoveryRun | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM discovery_runs WHERE status = 'running' ORDER BY id DESC LIMIT 1")
    .get() as RunRow | undefined;
  return row ? hydrate(row) : null;
}

/**
 * Columns that `updateDiscoveryRun` is allowed to write. Hard-coded at the
 * call site so dynamic object keys can never reach the SQL string.
 */
const UPDATABLE_COLUMNS = new Set<string>([
  'status',
  'ended_at',
  'companies_checked',
  'postings_found',
  'postings_new',
  'postings_scored',
  'current_company',
  'error',
]);

/**
 * Partial update on a run row. Only whitelisted fields are written; passing
 * any key outside `UPDATABLE_COLUMNS` throws loudly so programming errors
 * surface in tests instead of getting silently interpolated into SQL.
 */
export function updateDiscoveryRun(
  id: number,
  patch: Partial<
    Pick<
      DiscoveryRun,
      | 'status'
      | 'ended_at'
      | 'companies_checked'
      | 'postings_found'
      | 'postings_new'
      | 'postings_scored'
      | 'current_company'
      | 'error'
    >
  >,
): void {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (!UPDATABLE_COLUMNS.has(key)) {
      throw new Error(`updateDiscoveryRun: refusing to update unknown column '${key}'`);
    }
    sets.push(`${key} = ?`);
    values.push(value);
  }
  if (sets.length === 0) return;

  values.push(id);
  db.prepare(`UPDATE discovery_runs SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

export function appendDiscoveryLog(
  id: number,
  entry: { level: 'info' | 'warn' | 'error'; msg: string },
): void {
  const db = getDb();
  const row = db
    .prepare('SELECT log FROM discovery_runs WHERE id = ?')
    .get(id) as { log: string } | undefined;
  if (!row) return;
  let log: DiscoveryLogEntry[] = [];
  try {
    log = JSON.parse(row.log || '[]');
  } catch {
    log = [];
  }
  log.push({
    ts: new Date().toISOString(),
    level: entry.level,
    msg: entry.msg,
  });
  // Cap log size to avoid unbounded growth on very long runs.
  if (log.length > 500) log = log.slice(-500);
  db.prepare('UPDATE discovery_runs SET log = ? WHERE id = ?').run(JSON.stringify(log), id);
}

/**
 * Mark any runs that are still "running" but older than maxAgeMinutes as errored.
 * Called on dashboard load to clean up runs orphaned by a dev-server restart.
 */
export function reapOrphanedRuns(maxAgeMinutes = 10): number {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE discovery_runs
       SET status = 'error',
           error = 'Run abandoned — server process likely restarted',
           ended_at = datetime('now')
       WHERE status = 'running'
         AND datetime(started_at, '+' || ? || ' minutes') < datetime('now')`,
    )
    .run(maxAgeMinutes);
  return result.changes;
}

// ---------------------------------------------------------------------------
// Discovery suggestions — persistent storage for Claude-suggested companies
// ---------------------------------------------------------------------------

export interface SuggestionRow {
  id: number;
  batch_id: string;
  name: string;
  category: string | null;
  why_fits: string | null;
  careers_url: string | null;
  verified: number;
  verified_provider: string | null;
  verified_slug: string | null;
  open_postings: number;
  status: string;
  batch_model: string | null;
  batch_cost: number;
  batch_role_type: string | null;
  created_at: string;
}

export interface CachedPosting {
  id: number;
  suggestion_id: number;
  title: string;
  url: string | null;
  location: string | null;
  salary: string | null;
  posting_text: string | null;
}

export function insertSuggestionBatch(
  batchId: string,
  suggestions: {
    name: string;
    category?: string;
    why_fits?: string;
    careers_url?: string | null;
    verified: boolean;
    verified_provider: AtsProvider | null;
    verified_slug: string | null;
    open_postings: number;
    postings: { title: string; url: string; location?: string; salary_range?: string; posting_text: string }[];
  }[],
  model: string,
  cost: number,
  roleType?: string,
): void {
  const db = getDb();
  const insertSuggestion = db.prepare(`
    INSERT INTO discovery_suggestions
      (batch_id, name, category, why_fits, careers_url, verified, verified_provider,
       verified_slug, open_postings, batch_model, batch_cost, batch_role_type)
    VALUES
      (@batch_id, @name, @category, @why_fits, @careers_url, @verified, @verified_provider,
       @verified_slug, @open_postings, @batch_model, @batch_cost, @batch_role_type)
  `);
  const insertPosting = db.prepare(`
    INSERT INTO discovery_postings_cache
      (suggestion_id, title, url, location, salary, posting_text)
    VALUES
      (@suggestion_id, @title, @url, @location, @salary, @posting_text)
  `);

  const tx = db.transaction(() => {
    for (const s of suggestions) {
      const result = insertSuggestion.run({
        batch_id: batchId,
        name: s.name,
        category: s.category || null,
        why_fits: s.why_fits || null,
        careers_url: s.careers_url || null,
        verified: s.verified ? 1 : 0,
        verified_provider: s.verified_provider,
        verified_slug: s.verified_slug,
        open_postings: s.open_postings,
        batch_model: model,
        batch_cost: cost,
        batch_role_type: roleType || null,
      });
      const suggestionId = result.lastInsertRowid as number;
      for (const p of s.postings) {
        insertPosting.run({
          suggestion_id: suggestionId,
          title: p.title,
          url: p.url || null,
          location: p.location || null,
          salary: p.salary_range || null,
          posting_text: p.posting_text || null,
        });
      }
    }
  });
  tx();
}

export function getPendingSuggestions(): SuggestionRow[] {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM discovery_suggestions
     WHERE status = 'pending'
     ORDER BY verified DESC, open_postings DESC, created_at DESC`
  ).all() as SuggestionRow[];
}

export function getSuggestionById(id: number): SuggestionRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM discovery_suggestions WHERE id = ?').get(id) as SuggestionRow | undefined;
}

export function getSuggestionByName(name: string): SuggestionRow | undefined {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM discovery_suggestions
     WHERE name = ? AND status = 'pending'
     ORDER BY created_at DESC LIMIT 1`
  ).get(name) as SuggestionRow | undefined;
}

export function getCachedPostings(suggestionId: number): CachedPosting[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM discovery_postings_cache WHERE suggestion_id = ?'
  ).all(suggestionId) as CachedPosting[];
}

export function markSuggestionTracked(id: number): void {
  const db = getDb();
  db.prepare("UPDATE discovery_suggestions SET status = 'tracked' WHERE id = ?").run(id);
}

export function markSuggestionSkipped(id: number): void {
  const db = getDb();
  db.prepare("UPDATE discovery_suggestions SET status = 'skipped' WHERE id = ?").run(id);
}

export function updateSuggestionVerification(
  id: number,
  verified: boolean,
  provider: AtsProvider | null,
  slug: string | null,
  postings: { title: string; url: string; location?: string; salary_range?: string; posting_text: string }[],
): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE discovery_suggestions
       SET verified = ?, verified_provider = ?, verified_slug = ?, open_postings = ?
       WHERE id = ?`
    ).run(verified ? 1 : 0, provider, slug, postings.length, id);

    // Replace any stale cached postings
    db.prepare('DELETE FROM discovery_postings_cache WHERE suggestion_id = ?').run(id);
    const insert = db.prepare(`
      INSERT INTO discovery_postings_cache (suggestion_id, title, url, location, salary, posting_text)
      VALUES (@suggestion_id, @title, @url, @location, @salary, @posting_text)
    `);
    for (const p of postings) {
      insert.run({
        suggestion_id: id,
        title: p.title,
        url: p.url || null,
        location: p.location || null,
        salary: p.salary_range || null,
        posting_text: p.posting_text || null,
      });
    }
  });
  tx();
}

export function getUnverifiedPendingSuggestions(): SuggestionRow[] {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM discovery_suggestions
     WHERE status = 'pending' AND verified = 0
     ORDER BY created_at DESC`
  ).all() as SuggestionRow[];
}

export function getAlreadySuggestedNames(): string[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT DISTINCT name FROM discovery_suggestions'
  ).all() as { name: string }[];
  return rows.map((r) => r.name);
}

export function getLatestBatchMeta(): { model: string; cost: number; created_at: string } | null {
  const db = getDb();
  const row = db.prepare(
    `SELECT batch_model, batch_cost, created_at
     FROM discovery_suggestions
     ORDER BY created_at DESC LIMIT 1`
  ).get() as { batch_model: string; batch_cost: number; created_at: string } | undefined;
  if (!row) return null;
  return { model: row.batch_model, cost: row.batch_cost, created_at: row.created_at };
}
