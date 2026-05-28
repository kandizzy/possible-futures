import { describe, it, expect } from 'vitest';
import { changeApplicationStatus, createApplication } from '@/actions/applications';
import { insertApplication, getApplicationEvents, getApplicationByRoleId } from '@/lib/queries/applications';
import { insertRole } from '@/lib/queries/roles';
import { makeAiScores } from '@/test/db-helper';

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
}

function insertTestRole() {
  return insertRole({ title: 'Test', company: 'Co', ai_scores: makeAiScores(), ai_recommendation: 'apply' });
}

describe('changeApplicationStatus', () => {
  it('records a timeline event with the note', async () => {
    const roleId = insertTestRole();
    const appId = insertApplication({ role_id: roleId, current_status: 'Submitted' });

    const res = await changeApplicationStatus(
      makeFormData({ app_id: String(appId), status: 'Phone Screen', note: 'recruiter reached out' }),
    );
    expect(res.success).toBe(true);

    const events = getApplicationEvents(appId);
    const last = events[events.length - 1];
    expect(last.status).toBe('Phone Screen');
    expect(last.note).toBe('recruiter reached out');
  });

  it('changes status without recording an event when no note is given', async () => {
    const roleId = insertTestRole();
    const appId = insertApplication({ role_id: roleId, current_status: 'Submitted' });

    const res = await changeApplicationStatus(
      makeFormData({ app_id: String(appId), status: 'Rejected' }),
    );
    expect(res.success).toBe(true);

    // The status moves, but a skipped (note-less) change leaves no trace.
    expect(getApplicationByRoleId(roleId)!.current_status).toBe('Rejected');
    expect(getApplicationEvents(appId)).toHaveLength(0);
  });

  it('rejects an invalid status without recording an event', async () => {
    const roleId = insertTestRole();
    const appId = insertApplication({ role_id: roleId, current_status: 'Submitted' });

    const res = await changeApplicationStatus(
      makeFormData({ app_id: String(appId), status: 'Bogus' }),
    );
    expect(res.success).toBe(false);
    expect(getApplicationEvents(appId)).toHaveLength(0);
  });
});

describe('createApplication', () => {
  it('creates a Submitted application without seeding a timeline event', async () => {
    const roleId = insertTestRole();
    const res = await createApplication(makeFormData({ role_id: String(roleId) }));
    expect(res.success).toBe(true);

    const app = getApplicationByRoleId(roleId)!;
    expect(app.current_status).toBe('Submitted');
    // History is opt-in — creating an application doesn't auto-log anything.
    expect(getApplicationEvents(app.id)).toHaveLength(0);
  });
});
