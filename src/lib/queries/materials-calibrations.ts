import { getDb } from '../db';

interface MaterialsCalibrationRow {
  id: number;
  role_id: number;
  field: string;
  ai_text: string;
  edited_text: string;
  reason: string | null;
  created_at: string;
  title: string;
  company: string;
}

export function insertMaterialsCalibration(data: {
  role_id: number;
  field: string;
  ai_text: string;
  edited_text: string;
  reason?: string;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO materials_calibrations (role_id, field, ai_text, edited_text, reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.role_id, data.field, data.ai_text, data.edited_text, data.reason || null);
}

export function getRecentMaterialsCalibrations(limit = 5): MaterialsCalibrationRow[] {
  const db = getDb();
  return db.prepare(`
    SELECT mc.*, r.title, r.company
    FROM materials_calibrations mc
    JOIN roles r ON r.id = mc.role_id
    ORDER BY mc.created_at DESC
    LIMIT ?
  `).all(limit) as MaterialsCalibrationRow[];
}
