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

  it('records an event even when no note is given', async () => {
    const roleId = insertTestRole();
    const appId = insertApplication({ role_id: roleId, current_status: 'Submitted' });

    await changeApplicationStatus(makeFormData({ app_id: String(appId), status: 'Rejected' }));

    const events = getApplicationEvents(appId);
    const last = events[events.length - 1];
    expect(last.status).toBe('Rejected');
    expect(last.note).toBeNull();
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
  it('seeds the timeline with a Submitted event', async () => {
    const roleId = insertTestRole();
    const res = await createApplication(makeFormData({ role_id: String(roleId) }));
    expect(res.success).toBe(true);

    const app = getApplicationByRoleId(roleId)!;
    const events = getApplicationEvents(app.id);
    expect(events).toHaveLength(1);
    expect(events[0].status).toBe('Submitted');
  });
});
