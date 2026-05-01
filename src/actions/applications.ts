'use server';

import { revalidatePath } from 'next/cache';
import { insertApplication, updateApplicationStatus, updateApplicationNotes, getApplicationByRoleId, upsertApplicationForRole } from '@/lib/queries/applications';
import { updateRoleStatus, getRoleById } from '@/lib/queries/roles';
import { getDb } from '@/lib/db';
import type { ResumeVersion, RoleStatus } from '@/lib/types';

const VALID_APP_STATUSES = new Set(['Submitted', 'Phone Screen', 'Interview', 'Take Home', 'Offer', 'Rejected', 'Withdrawn']);

export async function createApplication(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const roleId = Number(formData.get('role_id'));
  const resumeVersion = formData.get('resume_version') as ResumeVersion | null;
  const dateApplied = (formData.get('date_applied') as string) || new Date().toISOString().split('T')[0];
  const notes = (formData.get('notes') as string)?.trim() || '';

  if (!roleId) return { success: false, error: 'Role ID required.' };

  insertApplication({
    role_id: roleId,
    resume_version_used: resumeVersion || undefined,
    date_applied: dateApplied,
    current_status: 'Submitted',
    notes: notes || undefined,
  });

  // Also update role status
  updateRoleStatus(roleId, 'Applied');

  revalidatePath('/');
  revalidatePath('/applications');
  revalidatePath(`/roles/${roleId}`);
  return { success: true };
}

export async function changeApplicationStatus(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const appId = Number(formData.get('app_id'));
  const status = formData.get('status') as string;
  const nextSteps = (formData.get('next_steps') as string)?.trim();

  if (!appId || !status) {
    return { success: false, error: 'Application ID and status are required.' };
  }

  if (!VALID_APP_STATUSES.has(status)) {
    return { success: false, error: 'Invalid status.' };
  }

  try {
    updateApplicationStatus(appId, status, nextSteps || undefined);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `Failed to update status: ${message}` };
  }
  revalidatePath('/applications');
  return { success: true };
}

export async function markApplicationSubmitted(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const roleId = Number(formData.get('role_id'));
  if (!roleId || !Number.isInteger(roleId)) {
    return { success: false, error: 'Role id is required.' };
  }
  if (!getRoleById(roleId)) {
    return { success: false, error: 'Role not found.' };
  }

  const appId = upsertApplicationForRole(roleId);
  const today = new Date().toISOString().split('T')[0];
  const db = getDb();
  db.prepare(
    "UPDATE applications SET current_status = 'Submitted', date_applied = ? WHERE id = ?",
  ).run(today, appId);
  updateRoleStatus(roleId, 'Applied');

  revalidatePath('/');
  revalidatePath('/applications');
  revalidatePath(`/roles/${roleId}`);
  return { success: true };
}

export async function unmarkApplicationSubmitted(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const roleId = Number(formData.get('role_id'));
  if (!roleId || !Number.isInteger(roleId)) {
    return { success: false, error: 'Role id is required.' };
  }
  const app = getApplicationByRoleId(roleId);
  if (!app) {
    return { success: false, error: 'No application to revert.' };
  }
  const db = getDb();
  db.prepare(
    "UPDATE applications SET current_status = 'Draft', date_applied = NULL WHERE id = ?",
  ).run(app.id);

  revalidatePath('/');
  revalidatePath('/applications');
  revalidatePath(`/roles/${roleId}`);
  return { success: true };
}

export async function saveApplicationNotes(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const appId = Number(formData.get('app_id'));
  const notes = (formData.get('notes') as string) || '';

  if (!appId) {
    return { success: false, error: 'Application ID is required.' };
  }

  try {
    updateApplicationNotes(appId, notes);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `Failed to save notes: ${message}` };
  }
  return { success: true };
}
