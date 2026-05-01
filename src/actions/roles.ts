'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { archiveRole, deleteRole, getRoleById, unarchiveRole, updateRoleMetadata, type RoleMetadataPatch } from '@/lib/queries/roles';

export interface UpdateRoleMetadataResult {
  ok: boolean;
  error?: string;
}

export async function updateRoleMetadataAction(
  formData: FormData,
): Promise<UpdateRoleMetadataResult> {
  const idRaw = formData.get('id');
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: 'Missing or invalid role id.' };
  }

  const existing = getRoleById(id);
  if (!existing) {
    return { ok: false, error: 'Role not found.' };
  }

  const company = (formData.get('company') as string | null)?.trim() ?? '';
  const title = (formData.get('title') as string | null)?.trim() ?? '';
  const location = (formData.get('location') as string | null)?.trim() ?? '';
  const salary = (formData.get('salary_range') as string | null)?.trim() ?? '';
  const url = (formData.get('url') as string | null)?.trim() ?? '';

  if (!company) return { ok: false, error: 'Company is required.' };
  if (!title) return { ok: false, error: 'Title is required.' };

  const patch: RoleMetadataPatch = {
    company,
    title,
    location: location || null,
    salary_range: salary || null,
    url: url || null,
  };

  updateRoleMetadata(id, patch);

  revalidatePath(`/roles/${id}`);
  revalidatePath('/');
  revalidatePath('/applications');
  return { ok: true };
}

export async function archiveRoleAction(formData: FormData): Promise<void> {
  const idRaw = formData.get('id');
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Missing or invalid role id.');
  }

  const existing = getRoleById(id);
  if (!existing) {
    throw new Error('Role not found.');
  }

  archiveRole(id);

  revalidatePath(`/roles/${id}`);
  revalidatePath('/');
  revalidatePath('/applications');
  revalidatePath('/archive');
  redirect('/');
}

export async function unarchiveRoleAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const idRaw = formData.get('id');
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: 'Missing or invalid role id.' };
  }

  const existing = getRoleById(id);
  if (!existing) {
    return { ok: false, error: 'Role not found.' };
  }

  unarchiveRole(id);

  revalidatePath(`/roles/${id}`);
  revalidatePath('/');
  revalidatePath('/applications');
  revalidatePath('/archive');
  return { ok: true };
}

export async function deleteRoleAction(formData: FormData): Promise<void> {
  const idRaw = formData.get('id');
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('Missing or invalid role id.');
  }

  const existing = getRoleById(id);
  if (!existing) {
    throw new Error('Role not found.');
  }

  deleteRole(id);

  revalidatePath('/');
  revalidatePath('/applications');
  redirect('/');
}
