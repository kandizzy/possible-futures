import { describe, it, expect } from 'vitest';
import { insertMaterialsCalibration, getRecentMaterialsCalibrations } from '@/lib/queries/materials-calibrations';
import { insertRole } from '@/lib/queries/roles';
import { makeAiScores } from '@/test/db-helper';

function insertTestRole(title = 'Test', company = 'Co') {
  return insertRole({ title, company, ai_scores: makeAiScores(), ai_recommendation: 'apply' });
}

describe('insertMaterialsCalibration', () => {
  it('inserts without error', () => {
    const roleId = insertTestRole();
    expect(() => {
      insertMaterialsCalibration({
        role_id: roleId,
        field: 'cover_letter',
        ai_text: 'AI wrote this',
        edited_text: 'User changed it',
        reason: 'Too formal',
      });
    }).not.toThrow();
  });

  it('inserts without reason', () => {
    const roleId = insertTestRole();
    expect(() => {
      insertMaterialsCalibration({
        role_id: roleId,
        field: 'resume_summary',
        ai_text: 'Original',
        edited_text: 'Edited',
      });
    }).not.toThrow();
  });
});

describe('getRecentMaterialsCalibrations', () => {
  it('joins roles table for title and company', () => {
    const roleId = insertTestRole('UX Eng', 'BigCo');
    insertMaterialsCalibration({
      role_id: roleId,
      field: 'cover_letter',
      ai_text: 'AI',
      edited_text: 'User',
    });
    const results = getRecentMaterialsCalibrations();
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('UX Eng');
    expect(results[0].company).toBe('BigCo');
    expect(results[0].field).toBe('cover_letter');
  });

  it('respects limit parameter', () => {
    const roleId = insertTestRole();
    for (let i = 0; i < 5; i++) {
      insertMaterialsCalibration({
        role_id: roleId,
        field: 'cover_letter',
        ai_text: `AI ${i}`,
        edited_text: `User ${i}`,
      });
    }
    expect(getRecentMaterialsCalibrations(2)).toHaveLength(2);
  });
});
