import { getDb } from '../db';
import type { Company, CompanyWithPipeline, AtsProvider } from '../types';

export function getAllCompanies(): Company[] {
  const db = getDb();
  return db.prepare('SELECT * FROM companies ORDER BY name ASC').all() as Company[];
}

export function getCompaniesWithPipeline(): CompanyWithPipeline[] {
  const db = getDb();
  return db.prepare(`
    SELECT c.*,
      COUNT(r.id) as role_count,
      SUM(CASE WHEN r.status = 'New' THEN 1 ELSE 0 END) as new_count,
      SUM(CASE WHEN r.status = 'Applied' THEN 1 ELSE 0 END) as applied_count,
      SUM(CASE WHEN r.status = 'Interviewing' THEN 1 ELSE 0 END) as interviewing_count,
      SUM(CASE WHEN r.status = 'Offer' THEN 1 ELSE 0 END) as offer_count,
      SUM(CASE WHEN r.status IN ('Rejected','Ghosted','Withdrawn') THEN 1 ELSE 0 END) as closed_count,
      COALESCE(MAX(r.date_added), c.last_checked) as last_activity
    FROM companies c
    LEFT JOIN roles r ON r.company = c.name
    WHERE c.skipped_at IS NULL
    GROUP BY c.id
  `).all() as CompanyWithPipeline[];
}

export function getCompanyById(id: number): Company | null {
  const db = getDb();
  return db.prepare('SELECT * FROM companies WHERE id = ?').get(id) as Company | undefined || null;
}

export function getCompanyByName(name: string): Company | null {
  const db = getDb();
  return db.prepare('SELECT * FROM companies WHERE name = ?').get(name) as Company | undefined || null;
}

export function insertCompany(data: {
  name: string;
  category?: string;
  why_interested?: string;
  careers_url?: string;
  ats_provider?: AtsProvider | null;
  ats_slug?: string | null;
  source?: 'manual' | 'seed' | 'claude_suggestion';
}): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO companies (name, category, why_interested, careers_url, ats_provider, ats_slug, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.name,
    data.category || null,
    data.why_interested || null,
    data.careers_url || null,
    data.ats_provider || null,
    data.ats_slug || null,
    data.source || 'manual',
  );
  return result.lastInsertRowid as number;
}

export function markCompanySkipped(name: string): void {
  const db = getDb();
  const existing = getCompanyByName(name);
  if (existing) {
    db.prepare("UPDATE companies SET skipped_at = datetime('now') WHERE id = ?").run(existing.id);
    return;
  }
  // Create a placeholder row so we remember not to suggest it next time.
  db.prepare(`
    INSERT INTO companies (name, source, skipped_at)
    VALUES (?, 'claude_suggestion', datetime('now'))
  `).run(name);
}

export function getSkippedCompanyNames(): string[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT name FROM companies WHERE skipped_at IS NOT NULL')
    .all() as { name: string }[];
  return rows.map((r) => r.name);
}

export function getTrackedCompanyNames(): string[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT name FROM companies WHERE skipped_at IS NULL')
    .all() as { name: string }[];
  return rows.map((r) => r.name);
}

export function updateCompanyLastChecked(id: number): void {
  const db = getDb();
  db.prepare("UPDATE companies SET last_checked = datetime('now') WHERE id = ?").run(id);
}

/**
 * Only companies with an ATS provider + slug configured. The discovery
 * orchestrator iterates this list.
 */
export function getCompaniesWithAts(): Company[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM companies
       WHERE ats_provider IS NOT NULL AND ats_slug IS NOT NULL
       ORDER BY name ASC`,
    )
    .all() as Company[];
}

export function setCompanyAts(
  id: number,
  provider: AtsProvider | null,
  slug: string | null,
): void {
  const db = getDb();
  db.prepare('UPDATE companies SET ats_provider = ?, ats_slug = ? WHERE id = ?').run(
    provider,
    slug,
    id,
  );
}

export function updateCompanyLastScanned(id: number): void {
  const db = getDb();
  db.prepare("UPDATE companies SET last_scanned_at = datetime('now') WHERE id = ?").run(id);
}
