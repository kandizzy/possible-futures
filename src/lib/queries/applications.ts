import { getDb } from '../db';
import type { Application, ResumeVersion } from '../types';

export function getAllApplications(): (Application & { role_title: string; role_company: string })[] {
  const db = getDb();
  // Drafts (rows auto-created when generating materials but never submitted)
  // don't belong on the Applications list. Archived roles' applications also
  // shouldn't show — archiving a role takes its application out of the active
  // ledger but the row stays in the DB so the user can unarchive later.
  return db.prepare(`
    SELECT a.*, r.title as role_title, r.company as role_company
    FROM applications a
    JOIN roles r ON r.id = a.role_id
    WHERE a.current_status != 'Draft'
      AND r.archived = 0
    ORDER BY a.date_applied DESC NULLS LAST
  `).all() as (Application & { role_title: string; role_company: string })[];
}

/**
 * How many real (non-Draft) applications are hidden because their role is
 * archived. Used to surface a "X archived → view archive" hint on the
 * Applications page so users aren't confused when something they remember
 * sending isn't in the active list.
 */
export function getArchivedApplicationCount(): number {
  const db = getDb();
  const row = db.prepare(`
    SELECT COUNT(*) as c
    FROM applications a
    JOIN roles r ON r.id = a.role_id
    WHERE a.current_status != 'Draft'
      AND r.archived = 1
  `).get() as { c: number };
  return row.c;
}

export function getApplicationByRoleId(roleId: number): Application | null {
  const db = getDb();
  return db.prepare('SELECT * FROM applications WHERE role_id = ? ORDER BY id DESC LIMIT 1').get(roleId) as Application | undefined || null;
}

export function insertApplication(data: {
  role_id: number;
  resume_version_used?: ResumeVersion;
  cover_letter_text?: string;
  cover_letter_generated?: boolean;
  resume_summary_text?: string;
  materials_notes?: string;
  version_folder_path?: string;
  date_applied?: string;
  current_status?: string;
  next_steps?: string;
  notes?: string;
}): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO applications (role_id, resume_version_used, cover_letter_text, cover_letter_generated,
      resume_summary_text, materials_notes, version_folder_path, date_applied, current_status, next_steps, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.role_id,
    data.resume_version_used || null,
    data.cover_letter_text || null,
    data.cover_letter_generated ? 1 : 0,
    data.resume_summary_text || null,
    data.materials_notes || null,
    data.version_folder_path || null,
    data.date_applied || null,
    data.current_status || 'Submitted',
    data.next_steps || null,
    data.notes || null,
  );
  return result.lastInsertRowid as number;
}

export function updateApplicationStatus(id: number, status: string, nextSteps?: string): void {
  const db = getDb();
  if (nextSteps !== undefined) {
    db.prepare('UPDATE applications SET current_status = ?, next_steps = ? WHERE id = ?').run(status, nextSteps, id);
  } else {
    db.prepare('UPDATE applications SET current_status = ? WHERE id = ?').run(status, id);
  }
}

export function updateApplicationNotes(id: number, notes: string): void {
  const db = getDb();
  db.prepare('UPDATE applications SET notes = ? WHERE id = ?').run(notes, id);
}

export function updateApplicationMaterials(id: number, data: {
  cover_letter_text: string;
  resume_summary_text: string;
  resume_text?: string;
  resume_version_used: string;
  version_folder_path?: string;
  cover_letter_ai_draft?: string;
}): void {
  const db = getDb();
  if (data.cover_letter_ai_draft) {
    db.prepare(`
      UPDATE applications
      SET cover_letter_text = ?, resume_summary_text = ?, resume_text = ?, resume_version_used = ?,
          version_folder_path = ?, cover_letter_generated = 1, cover_letter_ai_draft = ?
      WHERE id = ?
    `).run(
      data.cover_letter_text,
      data.resume_summary_text,
      data.resume_text || null,
      data.resume_version_used,
      data.version_folder_path || null,
      data.cover_letter_ai_draft,
      id,
    );
  } else {
    db.prepare(`
      UPDATE applications
      SET cover_letter_text = ?, resume_summary_text = ?, resume_text = ?, resume_version_used = ?,
          version_folder_path = ?, cover_letter_generated = 1
      WHERE id = ?
    `).run(
      data.cover_letter_text,
      data.resume_summary_text,
      data.resume_text || null,
      data.resume_version_used,
      data.version_folder_path || null,
      id,
    );
  }
}

export function upsertApplicationForRole(roleId: number): number {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM applications WHERE role_id = ? ORDER BY id DESC LIMIT 1').get(roleId) as { id: number } | undefined;
  if (existing) return existing.id;
  const result = db.prepare('INSERT INTO applications (role_id) VALUES (?)').run(roleId);
  return result.lastInsertRowid as number;
}
