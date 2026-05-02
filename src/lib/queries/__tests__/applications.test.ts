import { describe, it, expect } from 'vitest';
import {
  getAllApplications,
  getApplicationByRoleId,
  getArchivedApplicationCount,
  insertApplication,
  updateApplicationStatus,
  updateApplicationNotes,
  updateApplicationMaterials,
  upsertApplicationForRole,
} from '@/lib/queries/applications';
import { insertRole } from '@/lib/queries/roles';
import { makeAiScores } from '@/test/db-helper';

function insertTestRole() {
  return insertRole({ title: 'Test', company: 'Co', ai_scores: makeAiScores(), ai_recommendation: 'apply' });
}

describe('insertApplication + getApplicationByRoleId', () => {
  it('returns a numeric row ID', () => {
    const roleId = insertTestRole();
    const id = insertApplication({ role_id: roleId });
    expect(id).toBeGreaterThan(0);
  });

  it('returns the application for a role', () => {
    const roleId = insertTestRole();
    insertApplication({ role_id: roleId, resume_version_used: 'B', current_status: 'Submitted' });
    const app = getApplicationByRoleId(roleId)!;
    expect(app.role_id).toBe(roleId);
    expect(app.resume_version_used).toBe('B');
    expect(app.current_status).toBe('Submitted');
  });

  it('returns null when no application exists', () => {
    const roleId = insertTestRole();
    expect(getApplicationByRoleId(roleId)).toBeNull();
  });

  it('returns the most recent application when multiple exist', () => {
    const roleId = insertTestRole();
    insertApplication({ role_id: roleId, current_status: 'Submitted' });
    insertApplication({ role_id: roleId, current_status: 'Interview' });
    const app = getApplicationByRoleId(roleId)!;
    expect(app.current_status).toBe('Interview');
  });
});

describe('getAllApplications', () => {
  it('joins roles table for title and company', () => {
    const roleId = insertRole({ title: 'UX Eng', company: 'BigCo', ai_scores: makeAiScores(), ai_recommendation: 'apply' });
    insertApplication({ role_id: roleId });
    const apps = getAllApplications();
    expect(apps).toHaveLength(1);
    expect(apps[0].role_title).toBe('UX Eng');
    expect(apps[0].role_company).toBe('BigCo');
  });

  it('returns empty array when no applications', () => {
    expect(getAllApplications()).toEqual([]);
  });

  it('excludes applications whose role is archived', async () => {
    const { archiveRole } = await import('@/lib/queries/roles');
    const liveRoleId = insertRole({ title: 'Live', company: 'A', ai_scores: makeAiScores(), ai_recommendation: 'apply' });
    const archivedRoleId = insertRole({ title: 'Archived', company: 'B', ai_scores: makeAiScores(), ai_recommendation: 'apply' });
    insertApplication({ role_id: liveRoleId, current_status: 'Submitted' });
    insertApplication({ role_id: archivedRoleId, current_status: 'Submitted' });
    archiveRole(archivedRoleId);

    const apps = getAllApplications();
    expect(apps).toHaveLength(1);
    expect(apps[0].role_title).toBe('Live');
  });
});

describe('getArchivedApplicationCount', () => {
  it('returns 0 when nothing is archived', () => {
    const roleId = insertTestRole();
    insertApplication({ role_id: roleId, current_status: 'Submitted' });
    expect(getArchivedApplicationCount()).toBe(0);
  });

  it('counts non-Draft applications whose role is archived', async () => {
    const { archiveRole } = await import('@/lib/queries/roles');
    const r1 = insertRole({ title: 'A', company: 'X', ai_scores: makeAiScores(), ai_recommendation: 'apply' });
    const r2 = insertRole({ title: 'B', company: 'Y', ai_scores: makeAiScores(), ai_recommendation: 'apply' });
    const r3 = insertRole({ title: 'C', company: 'Z', ai_scores: makeAiScores(), ai_recommendation: 'apply' });
    insertApplication({ role_id: r1, current_status: 'Submitted' });
    insertApplication({ role_id: r2, current_status: 'Rejected' });
    insertApplication({ role_id: r3, current_status: 'Draft' });
    archiveRole(r1);
    archiveRole(r2);
    archiveRole(r3);

    // Drafts are excluded even when their role is archived.
    expect(getArchivedApplicationCount()).toBe(2);
  });
});

describe('updateApplicationStatus', () => {
  it('changes the status', () => {
    const roleId = insertTestRole();
    const appId = insertApplication({ role_id: roleId });
    updateApplicationStatus(appId, 'Interview');
    expect(getApplicationByRoleId(roleId)!.current_status).toBe('Interview');
  });

  it('sets next_steps when provided', () => {
    const roleId = insertTestRole();
    const appId = insertApplication({ role_id: roleId });
    updateApplicationStatus(appId, 'Interview', 'Prepare portfolio');
    expect(getApplicationByRoleId(roleId)!.next_steps).toBe('Prepare portfolio');
  });
});

describe('updateApplicationNotes', () => {
  it('sets notes', () => {
    const roleId = insertTestRole();
    const appId = insertApplication({ role_id: roleId });
    updateApplicationNotes(appId, 'Good conversation');
    expect(getApplicationByRoleId(roleId)!.notes).toBe('Good conversation');
  });
});

describe('updateApplicationMaterials', () => {
  it('sets materials and marks cover_letter_generated', () => {
    const roleId = insertTestRole();
    const appId = insertApplication({ role_id: roleId });
    updateApplicationMaterials(appId, {
      cover_letter_text: 'Dear hiring manager...',
      resume_summary_text: 'Experienced engineer...',
      resume_version_used: 'A',
    });
    const app = getApplicationByRoleId(roleId)!;
    expect(app.cover_letter_text).toBe('Dear hiring manager...');
    expect(app.resume_summary_text).toBe('Experienced engineer...');
    expect(app.cover_letter_generated).toBe(1);
  });

  it('saves cover_letter_ai_draft when provided', () => {
    const roleId = insertTestRole();
    const appId = insertApplication({ role_id: roleId });
    updateApplicationMaterials(appId, {
      cover_letter_text: 'Edited version',
      resume_summary_text: 'Summary',
      resume_version_used: 'B',
      cover_letter_ai_draft: 'Original AI draft',
    });
    const app = getApplicationByRoleId(roleId)!;
    expect(app.cover_letter_ai_draft).toBe('Original AI draft');
  });
});

describe('upsertApplicationForRole', () => {
  it('creates a new application when none exists', () => {
    const roleId = insertTestRole();
    const appId = upsertApplicationForRole(roleId);
    expect(appId).toBeGreaterThan(0);
    expect(getApplicationByRoleId(roleId)).not.toBeNull();
  });

  it('returns existing application ID when one exists', () => {
    const roleId = insertTestRole();
    const first = insertApplication({ role_id: roleId });
    const second = upsertApplicationForRole(roleId);
    expect(second).toBe(first);
  });
});
