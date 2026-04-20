import { describe, it, expect } from 'vitest';
import {
  getAllPeople,
  getPersonById,
  insertPerson,
  getPeopleByCompanyName,
  updatePersonLastInteraction,
  updatePersonNotes,
  updatePersonUrl,
  getPeopleNeedingAttention,
  linkPersonToCompany,
} from '@/lib/queries/people';
import { getDb } from '@/lib/db';

function insertCompany(name: string): number {
  const db = getDb();
  const result = db.prepare('INSERT INTO companies (name) VALUES (?)').run(name);
  return result.lastInsertRowid as number;
}

describe('insertPerson + getPersonById', () => {
  it('returns a numeric row ID', () => {
    const id = insertPerson({ name: 'Alice' });
    expect(id).toBeGreaterThan(0);
  });

  it('round-trips all fields', () => {
    const id = insertPerson({
      name: 'Bob',
      role: 'CTO',
      company: 'TechCo',
      why_they_matter: 'Old colleague',
      url: 'https://linkedin.com/in/bob',
    });
    const person = getPersonById(id)!;
    expect(person.name).toBe('Bob');
    expect(person.role).toBe('CTO');
    expect(person.company).toBe('TechCo');
    expect(person.why_they_matter).toBe('Old colleague');
    expect(person.url).toBe('https://linkedin.com/in/bob');
  });

  it('returns null for non-existent ID', () => {
    expect(getPersonById(999)).toBeNull();
  });
});

describe('getAllPeople', () => {
  it('returns people ordered by name ASC', () => {
    insertPerson({ name: 'Zara' });
    insertPerson({ name: 'Alice' });
    const people = getAllPeople();
    expect(people[0].name).toBe('Alice');
    expect(people[1].name).toBe('Zara');
  });
});

describe('updatePersonLastInteraction', () => {
  it('sets the date', () => {
    const id = insertPerson({ name: 'Test' });
    updatePersonLastInteraction(id, '2025-03-15');
    expect(getPersonById(id)!.last_interaction).toBe('2025-03-15');
  });
});

describe('updatePersonNotes', () => {
  it('sets notes', () => {
    const id = insertPerson({ name: 'Test' });
    updatePersonNotes(id, 'Met at conference');
    expect(getPersonById(id)!.notes).toBe('Met at conference');
  });
});

describe('updatePersonUrl', () => {
  it('sets URL', () => {
    const id = insertPerson({ name: 'Test' });
    updatePersonUrl(id, 'https://example.com');
    expect(getPersonById(id)!.url).toBe('https://example.com');
  });
});

describe('getPeopleByCompanyName', () => {
  it('finds people linked to a company via join table', () => {
    const companyId = insertCompany('Anthropic');
    const personId = insertPerson({ name: 'Claude', company: 'Anthropic' });
    linkPersonToCompany(personId, companyId);

    const results = getPeopleByCompanyName('Anthropic');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Claude');
  });

  it('returns empty when no link exists', () => {
    insertPerson({ name: 'Lonely' });
    expect(getPeopleByCompanyName('NoCo')).toEqual([]);
  });

  it('matches partial company names with LIKE', () => {
    const companyId = insertCompany('Anthropic Research');
    const personId = insertPerson({ name: 'Claude' });
    linkPersonToCompany(personId, companyId);

    expect(getPeopleByCompanyName('Anthropic')).toHaveLength(1);
  });
});

describe('getPeopleNeedingAttention', () => {
  it('returns people with null last_interaction', () => {
    insertPerson({ name: 'Never contacted' });
    const results = getPeopleNeedingAttention(30);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Never contacted');
  });

  it('returns people with old last_interaction', () => {
    const id = insertPerson({ name: 'Old contact' });
    updatePersonLastInteraction(id, '2020-01-01');
    expect(getPeopleNeedingAttention(30)).toHaveLength(1);
  });

  it('does not return recently contacted people', () => {
    const id = insertPerson({ name: 'Recent' });
    updatePersonLastInteraction(id, new Date().toISOString().slice(0, 10));
    expect(getPeopleNeedingAttention(30)).toHaveLength(0);
  });
});
