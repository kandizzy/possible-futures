import { describe, it, expect } from 'vitest';
import {
  insertCalibration,
  insertRecommendationOverride,
  getRecentCalibrations,
  getRecentRecommendationOverrides,
  getAllCalibrations,
  getCalibrationsByRole,
} from '@/lib/queries/calibrations';
import { insertRole } from '@/lib/queries/roles';
import { makeAiScores } from '@/test/db-helper';

function insertTestRole(title = 'Test Role', company = 'TestCo') {
  return insertRole({ title, company, ai_scores: makeAiScores(), ai_recommendation: 'apply' });
}

describe('insertCalibration', () => {
  it('returns a numeric row ID', () => {
    const roleId = insertTestRole();
    const id = insertCalibration({ role_id: roleId, dimension: 'want', ai_score: 2, my_score: 3, reason: 'More excited' });
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });
});

describe('getCalibrationsByRole', () => {
  it('returns calibrations for a specific role', () => {
    const r1 = insertTestRole('Role A');
    const r2 = insertTestRole('Role B');
    insertCalibration({ role_id: r1, dimension: 'want', ai_score: 2, my_score: 3, reason: 'test' });
    insertCalibration({ role_id: r2, dimension: 'can', ai_score: 1, my_score: 2, reason: 'test' });

    const cals = getCalibrationsByRole(r1);
    expect(cals).toHaveLength(1);
    expect(cals[0].dimension).toBe('want');
  });

  it('returns empty array for role with no calibrations', () => {
    const roleId = insertTestRole();
    expect(getCalibrationsByRole(roleId)).toEqual([]);
  });
});

describe('getRecentCalibrations', () => {
  it('joins roles table for title and company', () => {
    const roleId = insertTestRole('UX Engineer', 'BigCo');
    insertCalibration({ role_id: roleId, dimension: 'pay', ai_score: 1, my_score: 2, reason: 'underpaid' });

    const results = getRecentCalibrations();
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('UX Engineer');
    expect(results[0].company).toBe('BigCo');
  });

  it('respects limit parameter', () => {
    const roleId = insertTestRole();
    insertCalibration({ role_id: roleId, dimension: 'want', ai_score: 2, my_score: 3, reason: 'a' });
    insertCalibration({ role_id: roleId, dimension: 'can', ai_score: 2, my_score: 1, reason: 'b' });
    insertCalibration({ role_id: roleId, dimension: 'grow', ai_score: 2, my_score: 3, reason: 'c' });

    expect(getRecentCalibrations(2)).toHaveLength(2);
  });
});

describe('insertRecommendationOverride', () => {
  it('returns a numeric row ID', () => {
    const roleId = insertTestRole();
    const id = insertRecommendationOverride({
      role_id: roleId,
      ai_recommendation: 'apply',
      my_recommendation: 'skip',
      reason: 'Not interested',
    });
    expect(id).toBeGreaterThan(0);
  });
});

describe('getRecentRecommendationOverrides', () => {
  it('joins roles table for title and company', () => {
    const roleId = insertTestRole('Dev', 'StartupCo');
    insertRecommendationOverride({
      role_id: roleId,
      ai_recommendation: 'stretch',
      my_recommendation: 'apply',
      reason: 'Actually a fit',
    });

    const results = getRecentRecommendationOverrides();
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Dev');
    expect(results[0].company).toBe('StartupCo');
  });
});

describe('getAllCalibrations', () => {
  it('returns all calibrations across roles', () => {
    const r1 = insertTestRole('A');
    const r2 = insertTestRole('B');
    insertCalibration({ role_id: r1, dimension: 'want', ai_score: 2, my_score: 3, reason: 'a' });
    insertCalibration({ role_id: r2, dimension: 'can', ai_score: 1, my_score: 0, reason: 'b' });

    expect(getAllCalibrations()).toHaveLength(2);
  });
});
