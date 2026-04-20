import { getDb } from '../db';
import type { SourceFile } from '../types';

export function getSourceFile(filename: string): SourceFile | null {
  const db = getDb();
  return db.prepare('SELECT * FROM source_files WHERE filename = ?').get(filename) as SourceFile | undefined || null;
}

export function getAllSourceFiles(): SourceFile[] {
  const db = getDb();
  return db.prepare('SELECT * FROM source_files ORDER BY filename').all() as SourceFile[];
}

export function upsertSourceFile(filename: string, content: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO source_files (filename, content, last_loaded_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(filename) DO UPDATE SET
      content = excluded.content,
      last_loaded_at = datetime('now')
  `).run(filename, content);
}

/**
 * Parse resume version labels from the Playbook's Role-Type Emphasis Guide.
 * Looks for headers matching: ### Version A: Label Name
 * Returns a map like { A: "Creative Technologist", B: "Engineer" }
 */
export function getResumeVersionLabels(): Record<string, string> {
  const playbook = getSourceFile('APPLICATION_PLAYBOOK.md');
  if (!playbook) return {};

  const labels: Record<string, string> = {};
  const pattern = /^### Version ([A-Z]): (.+)$/gm;
  let match;
  while ((match = pattern.exec(playbook.content)) !== null) {
    labels[match[1]] = match[2].trim();
  }
  return labels;
}

/**
 * Returns version labels formatted for display: { A: "A: Creative Technologist", ... }
 */
export function getVersionLabelMap(): Record<string, string> {
  const labels = getResumeVersionLabels();
  const map: Record<string, string> = {};
  for (const [key, label] of Object.entries(labels)) {
    map[key] = `${key}: ${label}`;
  }
  return map;
}
