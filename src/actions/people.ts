'use server';

import { revalidatePath } from 'next/cache';
import {
  insertPerson,
  updatePersonLastInteraction,
  updatePersonNotes,
  updatePersonUrl,
  deletePerson,
} from '@/lib/queries/people';

export async function addPerson(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const name = (formData.get('name') as string)?.trim();
  if (!name) return { success: false, error: 'Name is required.' };

  const role = (formData.get('role') as string)?.trim() || undefined;
  const company = (formData.get('company') as string)?.trim() || undefined;
  const url = (formData.get('url') as string)?.trim() || undefined;

  insertPerson({ name, role, company, url });
  revalidatePath('/people');
  return { success: true };
}

export async function markContacted(formData: FormData): Promise<{ success: boolean }> {
  const personId = Number(formData.get('person_id'));
  if (!personId) return { success: false };

  updatePersonLastInteraction(personId, new Date().toISOString());
  revalidatePath('/people');
  return { success: true };
}

export async function updatePersonNotesAction(formData: FormData): Promise<{ success: boolean }> {
  const personId = Number(formData.get('person_id'));
  const notes = (formData.get('notes') as string) || '';
  if (!personId) return { success: false };

  updatePersonNotes(personId, notes);
  return { success: true };
}

export async function updatePersonUrlAction(formData: FormData): Promise<{ success: boolean }> {
  const personId = Number(formData.get('person_id'));
  const url = (formData.get('url') as string)?.trim() || '';
  if (!personId) return { success: false };

  updatePersonUrl(personId, url);
  return { success: true };
}

export async function deletePersonAction(personId: number): Promise<{ success: boolean }> {
  if (!personId) return { success: false };
  deletePerson(personId);
  revalidatePath('/people');
  return { success: true };
}
