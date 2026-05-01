'use server';

import { revalidatePath } from 'next/cache';
import { insertCalibration, insertRecommendationOverride } from '@/lib/queries/calibrations';
import { updateRoleScores, getRoleById, updateRoleStatus, updateRoleNotes } from '@/lib/queries/roles';
import type { Dimension, Recommendation, MyScores, RoleStatus } from '@/lib/types';

const VALID_DIMENSIONS = new Set<string>(['want', 'can', 'grow', 'pay', 'team', 'impact']);
const VALID_RECOMMENDATIONS = new Set<string>(['apply', 'stretch', 'skip']);
const VALID_STATUSES = new Set<string>(['New', 'Applied', 'Interviewing', 'Rejected', 'Ghosted', 'Withdrawn', 'Offer', 'Skipped']);

export async function overrideScore(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const roleId = Number(formData.get('role_id'));
  const dimension = formData.get('dimension') as string;
  const aiScore = Number(formData.get('ai_score'));
  const myScore = Number(formData.get('my_score'));
  const reason = (formData.get('reason') as string)?.trim();

  if (!roleId || !dimension || isNaN(myScore) || !reason) {
    return { success: false, error: 'All fields are required.' };
  }

  if (!VALID_DIMENSIONS.has(dimension)) {
    return { success: false, error: 'Invalid dimension.' };
  }

  if (myScore < 0 || myScore > 3) {
    return { success: false, error: 'Score must be 0-3.' };
  }

  const validDimension = dimension as Dimension;

  // Check role exists before writing
  const role = getRoleById(roleId);
  if (!role) return { success: false, error: 'Role not found.' };

  // Record the calibration
  insertCalibration({ role_id: roleId, dimension: validDimension, ai_score: aiScore, my_score: myScore, reason });

  const currentMyScores: MyScores = role.my_scores || {};
  currentMyScores[validDimension] = myScore;
  updateRoleScores(roleId, currentMyScores);

  revalidatePath(`/roles/${roleId}`);
  revalidatePath('/calibrations');
  return { success: true };
}

export async function overrideRecommendation(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const roleId = Number(formData.get('role_id'));
  const aiRecommendation = formData.get('ai_recommendation') as string;
  const myRecommendation = formData.get('my_recommendation') as string;
  const reason = (formData.get('reason') as string)?.trim();

  if (!roleId || !myRecommendation || !reason) {
    return { success: false, error: 'All fields are required.' };
  }

  if (!VALID_RECOMMENDATIONS.has(myRecommendation)) {
    return { success: false, error: 'Invalid recommendation.' };
  }

  insertRecommendationOverride({
    role_id: roleId,
    ai_recommendation: aiRecommendation as Recommendation,
    my_recommendation: myRecommendation as Recommendation,
    reason,
  });

  // Update the role
  const role = getRoleById(roleId);
  if (!role) return { success: false, error: 'Role not found.' };
  const currentMyScores: MyScores = role.my_scores || {};
  updateRoleScores(roleId, currentMyScores, myRecommendation as Recommendation);

  // Auto-set status to Skipped when recommendation is skip and role is still New
  if (myRecommendation === 'skip' && role.status === 'New') {
    updateRoleStatus(roleId, 'Skipped');
    revalidatePath('/');
  }

  revalidatePath(`/roles/${roleId}`);
  revalidatePath('/calibrations');
  return { success: true };
}

export async function updateStatus(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const roleId = Number(formData.get('role_id'));
  const status = formData.get('status') as string;
  if (!roleId || !status) return { success: false, error: 'Missing fields.' };
  if (!VALID_STATUSES.has(status)) return { success: false, error: 'Invalid status.' };

  updateRoleStatus(roleId, status as RoleStatus);

  // Keep the application row in sync. The Applications page (and the dashboard
  // submitted/interviewing/offers stats) reads from applications.current_status,
  // so if the role's status flips into the application lifecycle, the
  // application row needs to flip too. Without this, marking a role "Applied"
  // via the StatusSelect leaves the application stuck in 'Draft' and invisible.
  const ROLE_TO_APP_STATUS: Record<string, string | null> = {
    Applied: 'Submitted',
    Interviewing: 'Interview',
    Offer: 'Offer',
    Rejected: 'Rejected',
    Withdrawn: 'Withdrawn',
    // 'New', 'Ghosted', 'Skipped' don't have a clean application-side mapping —
    // leave the app row alone for those.
  };
  const newAppStatus = ROLE_TO_APP_STATUS[status];
  if (newAppStatus) {
    const { upsertApplicationForRole } = await import('@/lib/queries/applications');
    const { getDb } = await import('@/lib/db');
    const appId = upsertApplicationForRole(roleId);
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    // Stamp date_applied only when the app moves out of Draft for the first time.
    db.prepare(
      `UPDATE applications
       SET current_status = ?,
           date_applied = COALESCE(date_applied, ?)
       WHERE id = ?`,
    ).run(newAppStatus, today, appId);
    revalidatePath('/applications');
  }

  revalidatePath('/');
  revalidatePath(`/roles/${roleId}`);
  return { success: true };
}

export async function updateNotes(formData: FormData): Promise<{ success: boolean }> {
  const roleId = Number(formData.get('role_id'));
  const notes = (formData.get('notes') as string) || '';
  if (roleId) {
    updateRoleNotes(roleId, notes);
    revalidatePath(`/roles/${roleId}`);
  }
  return { success: true };
}
