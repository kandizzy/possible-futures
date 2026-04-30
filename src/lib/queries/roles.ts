import { getDb } from '../db';
import type {
  Role,
  RoleRow,
  AiScores,
  MyScores,
  GapItem,
  Recommendation,
  ResumeVersion,
  RoleStatus,
  RoleSource,
} from '../types';

function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

const DEFAULT_SCORES: AiScores = {
  want: { score: 0, rationale: 'Parse error' },
  can: { score: 0, rationale: 'Parse error' },
  grow: { score: 0, rationale: 'Parse error' },
  pay: { score: 0, rationale: 'Parse error' },
  team: { score: 0, rationale: 'Parse error' },
  impact: { score: 0, rationale: 'Parse error' },
};

function deserializeRole(row: RoleRow & Partial<{
  source: string | null;
  discovered_by_run_id: number | null;
  date_reviewed: string | null;
}>): Role {
  return {
    ...row,
    ai_scores: safeJsonParse<AiScores>(row.ai_scores, DEFAULT_SCORES),
    my_scores: row.my_scores ? safeJsonParse<MyScores | null>(row.my_scores, null) : null,
    ai_recommendation: row.ai_recommendation as Recommendation,
    my_recommendation: row.my_recommendation as Recommendation | null,
    recommended_resume_version: row.recommended_resume_version as ResumeVersion | null,
    signal_words_found: safeJsonParse<string[]>(row.signal_words_found, []),
    red_flags_found: safeJsonParse<string[]>(row.red_flags_found, []),
    gap_analysis: safeJsonParse<GapItem[]>(row.gap_analysis, []),
    status: row.status as RoleStatus,
    source: (row.source as RoleSource) || 'manual',
    discovered_by_run_id: row.discovered_by_run_id ?? null,
    date_reviewed: row.date_reviewed ?? null,
  };
}

export function getAllRoles(status?: string): Role[] {
  const db = getDb();
  if (status && status !== 'All') {
    const rows = db.prepare('SELECT * FROM roles WHERE status = ? ORDER BY date_added DESC').all(status) as RoleRow[];
    return rows.map(deserializeRole);
  }
  const rows = db.prepare('SELECT * FROM roles ORDER BY date_added DESC').all() as RoleRow[];
  return rows.map(deserializeRole);
}

export function getRolesByCompany(companyName: string, status?: string): Role[] {
  const db = getDb();
  if (status && status !== 'All') {
    const rows = db.prepare('SELECT * FROM roles WHERE company = ? AND status = ? ORDER BY date_added DESC').all(companyName, status) as RoleRow[];
    return rows.map(deserializeRole);
  }
  const rows = db.prepare('SELECT * FROM roles WHERE company = ? ORDER BY date_added DESC').all(companyName) as RoleRow[];
  return rows.map(deserializeRole);
}

export function getRoleStatusCounts(): Record<string, number> {
  const db = getDb();
  const rows = db.prepare('SELECT status, COUNT(*) as count FROM roles GROUP BY status').all() as Array<{ status: string; count: number }>;
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.status] = row.count;
  }
  return counts;
}

export function getRoleById(id: number): Role | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM roles WHERE id = ?').get(id) as RoleRow | undefined;
  return row ? deserializeRole(row) : null;
}

export function insertRole(data: {
  title: string;
  company: string;
  url?: string;
  posting_text?: string;
  salary_range?: string;
  location?: string;
  ai_scores: AiScores;
  ai_recommendation: Recommendation;
  recommended_resume_version?: ResumeVersion;
  signal_words_found?: string[];
  red_flags_found?: string[];
  fit_summary?: string;
  gap_analysis?: GapItem[];
  status?: RoleStatus;
  source?: RoleSource;
  discovered_by_run_id?: number | null;
}): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO roles (title, company, url, posting_text, salary_range, location,
      ai_scores, ai_recommendation, recommended_resume_version,
      signal_words_found, red_flags_found, fit_summary, gap_analysis, status,
      source, discovered_by_run_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.title,
    data.company,
    data.url || null,
    data.posting_text || null,
    data.salary_range || null,
    data.location || null,
    JSON.stringify(data.ai_scores),
    data.ai_recommendation,
    data.recommended_resume_version || null,
    JSON.stringify(data.signal_words_found || []),
    JSON.stringify(data.red_flags_found || []),
    data.fit_summary || null,
    data.gap_analysis ? JSON.stringify(data.gap_analysis) : null,
    data.status || 'New',
    data.source || 'manual',
    data.discovered_by_run_id ?? null,
  );
  return result.lastInsertRowid as number;
}

/**
 * Returns the set of URLs already present in the roles table (null URLs
 * excluded). Used by the discovery orchestrator for dedup before scoring.
 */
export function getRoleUrls(): string[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT url FROM roles WHERE url IS NOT NULL')
    .all() as { url: string }[];
  return rows.map((r) => r.url);
}

/**
 * Discovered roles that the user hasn't triaged yet.
 */
export function getUnreviewedDiscoveredRoles(): Role[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM roles
       WHERE source = 'discovered' AND date_reviewed IS NULL
       ORDER BY date_added DESC`,
    )
    .all() as RoleRow[];
  return rows.map(deserializeRole);
}

export function countUnreviewedDiscovered(): number {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(*) as c FROM roles WHERE source = 'discovered' AND date_reviewed IS NULL",
    )
    .get() as { c: number };
  return row.c;
}

export function markRoleReviewed(id: number): void {
  const db = getDb();
  db.prepare("UPDATE roles SET date_reviewed = datetime('now') WHERE id = ?").run(id);
}

export function updateRoleStatus(id: number, status: RoleStatus): void {
  const db = getDb();
  db.prepare('UPDATE roles SET status = ? WHERE id = ?').run(status, id);
}

export function updateRoleScores(id: number, myScores: MyScores, myRecommendation?: Recommendation): void {
  const db = getDb();
  if (myRecommendation) {
    db.prepare('UPDATE roles SET my_scores = ?, my_recommendation = ? WHERE id = ?')
      .run(JSON.stringify(myScores), myRecommendation, id);
  } else {
    db.prepare('UPDATE roles SET my_scores = ? WHERE id = ?')
      .run(JSON.stringify(myScores), id);
  }
}

export function updateRoleNotes(id: number, notes: string): void {
  const db = getDb();
  db.prepare('UPDATE roles SET notes = ? WHERE id = ?').run(notes, id);
}

export interface RoleMetadataPatch {
  company?: string;
  title?: string;
  location?: string | null;
  salary_range?: string | null;
  url?: string | null;
}

/**
 * Update the human-editable metadata on a role without touching the AI scoring
 * fields or the posting text. Used when a recruiter reveals a blinded company,
 * a title is clarified mid-interview, or a URL needs correcting.
 */
export function updateRoleMetadata(id: number, patch: RoleMetadataPatch): void {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (patch.company !== undefined) {
    fields.push('company = ?');
    values.push(patch.company);
  }
  if (patch.title !== undefined) {
    fields.push('title = ?');
    values.push(patch.title);
  }
  if (patch.location !== undefined) {
    fields.push('location = ?');
    values.push(patch.location);
  }
  if (patch.salary_range !== undefined) {
    fields.push('salary_range = ?');
    values.push(patch.salary_range);
  }
  if (patch.url !== undefined) {
    fields.push('url = ?');
    values.push(patch.url);
  }

  if (fields.length === 0) return;

  values.push(String(id));
  db.prepare(`UPDATE roles SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteRole(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM roles WHERE id = ?').run(id);
}
