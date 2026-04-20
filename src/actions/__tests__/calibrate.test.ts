import { describe, it, expect } from 'vitest';
import { overrideScore, overrideRecommendation, updateStatus, updateNotes } from '@/actions/calibrate';
import { insertRole, getRoleById } from '@/lib/queries/roles';
import { getCalibrationsByRole } from '@/lib/queries/calibrations';
import { makeAiScores } from '@/test/db-helper';

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
}

function insertTestRole(status = 'New') {
  return insertRole({ title: 'Test', company: 'Co', ai_scores: makeAiScores(), ai_recommendation: 'apply', status: status as 'New' });
}

describe('overrideScore', () => {
  it('rejects missing role_id', async () => {
    const res = await overrideScore(makeFormData({ dimension: 'want', ai_score: '2', my_score: '3', reason: 'test' }));
    expect(res.success).toBe(false);
    expect(res.error).toContain('required');
  });

  it('rejects missing reason', async () => {
    const roleId = insertTestRole();
    const res = await overrideScore(makeFormData({ role_id: String(roleId), dimension: 'want', ai_score: '2', my_score: '3', reason: '' }));
    expect(res.success).toBe(false);
  });

  it('rejects invalid dimension', async () => {
    const roleId = insertTestRole();
    const res = await overrideScore(makeFormData({ role_id: String(roleId), dimension: 'vibes', ai_score: '2', my_score: '3', reason: 'test' }));
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid dimension');
  });

  it('rejects score > 3', async () => {
    const roleId = insertTestRole();
    const res = await overrideScore(makeFormData({ role_id: String(roleId), dimension: 'want', ai_score: '2', my_score: '4', reason: 'test' }));
    expect(res.success).toBe(false);
    expect(res.error).toContain('0-3');
  });

  it('rejects score < 0', async () => {
    const roleId = insertTestRole();
    const res = await overrideScore(makeFormData({ role_id: String(roleId), dimension: 'want', ai_score: '2', my_score: '-1', reason: 'test' }));
    expect(res.success).toBe(false);
  });

  it('returns error when role does not exist', async () => {
    const res = await overrideScore(makeFormData({ role_id: '999', dimension: 'want', ai_score: '2', my_score: '3', reason: 'test' }));
    expect(res.success).toBe(false);
    expect(res.error).toContain('not found');
  });

  it('succeeds for valid input and inserts calibration', async () => {
    const roleId = insertTestRole();
    const res = await overrideScore(makeFormData({ role_id: String(roleId), dimension: 'want', ai_score: '2', my_score: '3', reason: 'More excited' }));
    expect(res.success).toBe(true);

    const cals = getCalibrationsByRole(roleId);
    expect(cals).toHaveLength(1);
    expect(cals[0].my_score).toBe(3);
  });

  it('updates the role my_scores', async () => {
    const roleId = insertTestRole();
    await overrideScore(makeFormData({ role_id: String(roleId), dimension: 'want', ai_score: '2', my_score: '3', reason: 'test' }));
    const role = getRoleById(roleId)!;
    expect(role.my_scores?.want).toBe(3);
  });

  it('accumulates multiple dimension overrides', async () => {
    const roleId = insertTestRole();
    await overrideScore(makeFormData({ role_id: String(roleId), dimension: 'want', ai_score: '2', my_score: '3', reason: 'a' }));
    await overrideScore(makeFormData({ role_id: String(roleId), dimension: 'can', ai_score: '2', my_score: '1', reason: 'b' }));
    const role = getRoleById(roleId)!;
    expect(role.my_scores?.want).toBe(3);
    expect(role.my_scores?.can).toBe(1);
  });
});

describe('overrideRecommendation', () => {
  it('rejects invalid recommendation', async () => {
    const roleId = insertTestRole();
    const res = await overrideRecommendation(makeFormData({
      role_id: String(roleId), ai_recommendation: 'apply', my_recommendation: 'maybe', reason: 'test',
    }));
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid recommendation');
  });

  it('succeeds for valid input', async () => {
    const roleId = insertTestRole();
    const res = await overrideRecommendation(makeFormData({
      role_id: String(roleId), ai_recommendation: 'apply', my_recommendation: 'skip', reason: 'Not interested',
    }));
    expect(res.success).toBe(true);
    expect(getRoleById(roleId)!.my_recommendation).toBe('skip');
  });

  it('auto-sets status to Skipped when skip + New', async () => {
    const roleId = insertTestRole('New');
    await overrideRecommendation(makeFormData({
      role_id: String(roleId), ai_recommendation: 'apply', my_recommendation: 'skip', reason: 'Pass',
    }));
    expect(getRoleById(roleId)!.status).toBe('Skipped');
  });

  it('does NOT auto-skip when status is Applied', async () => {
    const roleId = insertTestRole('Applied');
    await overrideRecommendation(makeFormData({
      role_id: String(roleId), ai_recommendation: 'apply', my_recommendation: 'skip', reason: 'Changed mind',
    }));
    expect(getRoleById(roleId)!.status).toBe('Applied');
  });

  it('does NOT auto-skip for apply recommendation', async () => {
    const roleId = insertTestRole('New');
    await overrideRecommendation(makeFormData({
      role_id: String(roleId), ai_recommendation: 'skip', my_recommendation: 'apply', reason: 'Actually good',
    }));
    expect(getRoleById(roleId)!.status).toBe('New');
  });
});

describe('updateStatus', () => {
  it('rejects invalid status', async () => {
    const roleId = insertTestRole();
    const res = await updateStatus(makeFormData({ role_id: String(roleId), status: 'Dancing' }));
    expect(res.success).toBe(false);
  });

  it('changes status for valid input', async () => {
    const roleId = insertTestRole();
    const res = await updateStatus(makeFormData({ role_id: String(roleId), status: 'Applied' }));
    expect(res.success).toBe(true);
    expect(getRoleById(roleId)!.status).toBe('Applied');
  });

  it('accepts all valid statuses', async () => {
    const statuses = ['New', 'Applied', 'Interviewing', 'Rejected', 'Ghosted', 'Withdrawn', 'Offer', 'Skipped'];
    for (const status of statuses) {
      const roleId = insertTestRole();
      const res = await updateStatus(makeFormData({ role_id: String(roleId), status }));
      expect(res.success).toBe(true);
    }
  });
});

describe('updateNotes', () => {
  it('updates notes', async () => {
    const roleId = insertTestRole();
    await updateNotes(makeFormData({ role_id: String(roleId), notes: 'Follow up' }));
    expect(getRoleById(roleId)!.notes).toBe('Follow up');
  });

  it('handles empty notes', async () => {
    const roleId = insertTestRole();
    await updateNotes(makeFormData({ role_id: String(roleId), notes: '' }));
    expect(getRoleById(roleId)!.notes).toBe('');
  });
});
