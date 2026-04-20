import { getDb } from '../db';
import type { Person } from '../types';

export function getAllPeople(): Person[] {
  const db = getDb();
  return db.prepare('SELECT * FROM people ORDER BY name ASC').all() as Person[];
}

export function getPersonById(id: number): Person | null {
  const db = getDb();
  return db.prepare('SELECT * FROM people WHERE id = ?').get(id) as Person | undefined || null;
}

export function insertPerson(data: {
  name: string;
  role?: string;
  company?: string;
  why_they_matter?: string;
  url?: string;
}): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO people (name, role, company, why_they_matter, url)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.name, data.role || null, data.company || null, data.why_they_matter || null, data.url || null);
  return result.lastInsertRowid as number;
}

export function linkPersonToCompany(personId: number, companyId: number): void {
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO people_companies (person_id, company_id) VALUES (?, ?)').run(personId, companyId);
}

export function getPeopleByCompanyName(companyName: string): Person[] {
  const db = getDb();
  const escaped = companyName.replace(/%/g, '\\%').replace(/_/g, '\\_');
  return db.prepare(`
    SELECT p.* FROM people p
    JOIN people_companies pc ON p.id = pc.person_id
    JOIN companies c ON c.id = pc.company_id
    WHERE LOWER(c.name) LIKE LOWER(?) ESCAPE '\\'
    ORDER BY p.name
  `).all(`%${escaped}%`) as Person[];
}

export function updatePersonLastInteraction(id: number, date: string): void {
  const db = getDb();
  db.prepare('UPDATE people SET last_interaction = ? WHERE id = ?').run(date, id);
}

export function updatePersonNotes(id: number, notes: string): void {
  const db = getDb();
  db.prepare('UPDATE people SET notes = ? WHERE id = ?').run(notes, id);
}

export function updatePersonUrl(id: number, url: string): void {
  const db = getDb();
  db.prepare('UPDATE people SET url = ? WHERE id = ?').run(url, id);
}

export function deletePerson(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM people WHERE id = ?').run(id);
}

export function getPeopleNeedingAttention(daysSince: number = 30): Person[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM people
    WHERE last_interaction IS NULL
       OR last_interaction < datetime('now', ? || ' days')
    ORDER BY last_interaction ASC NULLS FIRST
  `).all(`-${daysSince}`) as Person[];
}
