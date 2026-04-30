import { describe, it, expect } from 'vitest';
import { getAllRoles, getRoleById, insertRole, updateRoleStatus, updateRoleScores, updateRoleNotes, getRoleStatusCounts, deleteRole } from '@/lib/queries/roles';
import { insertCalibration } from '@/lib/queries/calibrations';
import { getDb } from '@/lib/db';
import { makeAiScores } from '@/test/db-helper';

function insertTestRole(overrides?: Record<string, unknown>) {
  return insertRole({
    title: 'Design Engineer',
    company: 'Acme',
    ai_scores: makeAiScores(),
    ai_recommendation: 'apply',
    ...overrides,
  });
}

describe('insertRole + getRoleById', () => {
  it('returns a numeric row ID', () => {
    const id = insertTestRole();
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  it('round-trips all fields', () => {
    const id = insertRole({
      title: 'UX Engineer',
      company: 'BigCo',
      url: 'https://example.com',
      posting_text: 'We need someone...',
      salary_range: '$150-200k',
      location: 'Remote',
      ai_scores: makeAiScores({ want: { score: 3, rationale: 'excited' } }),
      ai_recommendation: 'stretch',
      recommended_resume_version: 'B',
      signal_words_found: ['design systems', 'prototyping'],
      red_flags_found: ['blockchain'],
      fit_summary: 'Decent fit',
      gap_analysis: [{ gap: 'Go', why_it_matters: 'backend', project_ideas: ['learn Go'], existing_projects: [] }],
    });

    const role = getRoleById(id);
    expect(role).not.toBeNull();
    expect(role!.title).toBe('UX Engineer');
    expect(role!.company).toBe('BigCo');
    expect(role!.url).toBe('https://example.com');
    expect(role!.salary_range).toBe('$150-200k');
    expect(role!.location).toBe('Remote');
    expect(role!.ai_recommendation).toBe('stretch');
    expect(role!.recommended_resume_version).toBe('B');
    expect(role!.status).toBe('New');
  });

  it('deserializes ai_scores from JSON', () => {
    const id = insertRole({
      title: 'Test',
      company: 'Co',
      ai_scores: makeAiScores({ want: { score: 3, rationale: 'love it' } }),
      ai_recommendation: 'apply',
    });
    const role = getRoleById(id)!;
    expect(role.ai_scores.want.score).toBe(3);
    expect(role.ai_scores.want.rationale).toBe('love it');
  });

  it('deserializes signal_words_found and red_flags_found', () => {
    const id = insertRole({
      title: 'Test',
      company: 'Co',
      ai_scores: makeAiScores(),
      ai_recommendation: 'apply',
      signal_words_found: ['creative tech'],
      red_flags_found: ['ninja'],
    });
    const role = getRoleById(id)!;
    expect(role.signal_words_found).toEqual(['creative tech']);
    expect(role.red_flags_found).toEqual(['ninja']);
  });

  it('deserializes gap_analysis from JSON', () => {
    const gaps = [{ gap: 'Rust', why_it_matters: 'perf', project_ideas: ['CLI tool'], existing_projects: [] }];
    const id = insertRole({
      title: 'Test',
      company: 'Co',
      ai_scores: makeAiScores(),
      ai_recommendation: 'apply',
      gap_analysis: gaps,
    });
    const role = getRoleById(id)!;
    expect(role.gap_analysis).toEqual(gaps);
  });

  it('returns null for non-existent ID', () => {
    expect(getRoleById(999)).toBeNull();
  });

  it('returns fallback scores for malformed JSON', () => {
    const db = getDb();
    db.prepare(`
      INSERT INTO roles (title, company, ai_scores, ai_recommendation, status)
      VALUES (?, ?, ?, ?, ?)
    `).run('Bad', 'Co', 'NOT JSON', 'apply', 'New');

    const role = getRoleById(1)!;
    expect(role.ai_scores.want.score).toBe(0);
    expect(role.ai_scores.want.rationale).toBe('Parse error');
  });
});

describe('getAllRoles', () => {
  it('returns empty array when no roles exist', () => {
    expect(getAllRoles()).toEqual([]);
  });

  it('returns all roles', () => {
    insertTestRole({ title: 'A' });
    insertTestRole({ title: 'B' });
    expect(getAllRoles()).toHaveLength(2);
  });

  it('filters by status', () => {
    insertTestRole({ title: 'New one', status: 'New' });
    insertTestRole({ title: 'Applied one', status: 'Applied' });
    expect(getAllRoles('Applied')).toHaveLength(1);
    expect(getAllRoles('Applied')[0].title).toBe('Applied one');
  });

  it('returns all when status is "All"', () => {
    insertTestRole({ status: 'New' });
    insertTestRole({ status: 'Applied' });
    expect(getAllRoles('All')).toHaveLength(2);
  });
});

describe('updateRoleStatus', () => {
  it('changes the status', () => {
    const id = insertTestRole();
    updateRoleStatus(id, 'Applied');
    expect(getRoleById(id)!.status).toBe('Applied');
  });
});

describe('updateRoleScores', () => {
  it('sets my_scores', () => {
    const id = insertTestRole();
    updateRoleScores(id, { want: 3, can: 1 });
    const role = getRoleById(id)!;
    expect(role.my_scores).toEqual({ want: 3, can: 1 });
  });

  it('sets my_recommendation when provided', () => {
    const id = insertTestRole();
    updateRoleScores(id, { want: 1 }, 'skip');
    expect(getRoleById(id)!.my_recommendation).toBe('skip');
  });
});

describe('updateRoleNotes', () => {
  it('sets the notes', () => {
    const id = insertTestRole();
    updateRoleNotes(id, 'Follow up next week');
    expect(getRoleById(id)!.notes).toBe('Follow up next week');
  });
});

describe('getRoleStatusCounts', () => {
  it('returns correct counts per status', () => {
    insertTestRole({ status: 'New' });
    insertTestRole({ status: 'New' });
    insertTestRole({ status: 'Applied' });
    const counts = getRoleStatusCounts();
    expect(counts['New']).toBe(2);
    expect(counts['Applied']).toBe(1);
  });

  it('returns empty object when no roles', () => {
    expect(getRoleStatusCounts()).toEqual({});
  });
});

describe('deleteRole', () => {
  it('removes the role', () => {
    const id = insertTestRole();
    deleteRole(id);
    expect(getRoleById(id)).toBeNull();
  });

  it('cascades to calibrations', () => {
    const id = insertTestRole();
    insertCalibration({ role_id: id, dimension: 'want', ai_score: 2, my_score: 3, reason: 'test' });
    deleteRole(id);
    const db = getDb();
    const remaining = db.prepare('SELECT COUNT(*) as c FROM calibrations WHERE role_id = ?').get(id) as { c: number };
    expect(remaining.c).toBe(0);
  });

  it('leaves other roles untouched', () => {
    const keepId = insertTestRole({ company: 'Keeper' });
    const dropId = insertTestRole({ company: 'Goner' });
    deleteRole(dropId);
    expect(getRoleById(keepId)).not.toBeNull();
    expect(getRoleById(dropId)).toBeNull();
  });

  it('is a no-op for unknown ids', () => {
    expect(() => deleteRole(9999)).not.toThrow();
  });
});
