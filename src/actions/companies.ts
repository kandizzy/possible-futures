'use server';

import { revalidatePath } from 'next/cache';
import {
  insertCompany,
  getCompanyByName,
  getCompanyById,
  unskipCompany as unskipCompanyDb,
} from '@/lib/queries/companies';
import { getDb } from '@/lib/db';
import { autofillCompanyDetails, type AutofilledCompany } from '@/lib/ai/autofill-company';

/**
 * Manually add a company to the watchlist — the path that doesn't go through
 * Discover (and therefore doesn't burn AI tokens). The user supplies what
 * they know; ATS fields are optional and can be filled in later.
 *
 * The company shows up in /companies under Watchlist (no roles attached yet)
 * with `source = 'manual'`.
 */
export async function addCompanyManually(
  formData: FormData,
): Promise<{ success: boolean; error?: string; companyId?: number }> {
  const name = ((formData.get('name') as string) || '').trim();
  if (!name) {
    return { success: false, error: 'A company name is required.' };
  }

  const existing = getCompanyByName(name);
  if (existing) {
    return {
      success: false,
      error: `"${name}" is already on your list.`,
    };
  }

  const category = ((formData.get('category') as string) || '').trim() || undefined;
  const why_interested =
    ((formData.get('why_interested') as string) || '').trim() || undefined;
  const careers_url = ((formData.get('careers_url') as string) || '').trim() || undefined;

  const id = insertCompany({
    name,
    category,
    why_interested,
    careers_url,
    source: 'manual',
  });

  revalidatePath('/companies');
  return { success: true, companyId: id };
}

/**
 * Update an existing company's editable metadata. Name is intentionally NOT
 * editable here — roles join the companies table by name, so renaming would
 * orphan their join. If a real rename is ever needed, it's a separate
 * migration that updates roles.company in the same transaction.
 */
export async function updateCompany(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const id = Number(formData.get('id'));
  if (!id || !Number.isInteger(id)) {
    return { success: false, error: 'A valid company id is required.' };
  }
  const existing = getCompanyById(id);
  if (!existing) {
    return { success: false, error: 'Company not found.' };
  }

  const category = ((formData.get('category') as string) || '').trim() || null;
  const why_interested = ((formData.get('why_interested') as string) || '').trim() || null;
  const careers_url = ((formData.get('careers_url') as string) || '').trim() || null;

  const db = getDb();
  db.prepare(
    `UPDATE companies SET category = ?, why_interested = ?, careers_url = ? WHERE id = ?`,
  ).run(category, why_interested, careers_url, id);

  revalidatePath('/companies');
  return { success: true };
}

/**
 * Restore a previously-skipped company so it appears back in the watchlist
 * and isn't excluded from future Discover suggestions. Used by the "Skipped"
 * section on /companies.
 */
export async function unskipCompany(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const id = Number(formData.get('id'));
  if (!id || !Number.isInteger(id)) {
    return { success: false, error: 'A valid company id is required.' };
  }
  unskipCompanyDb(id);
  revalidatePath('/companies');
  revalidatePath('/discover');
  return { success: true };
}

/**
 * Use the configured AI backend to suggest category, why_interested,
 * careers_url, and an ATS guess for a company by name. Used by the
 * "Auto-fill →" button in the Add Company modal so the user doesn't have
 * to type details for well-known companies.
 *
 * Does NOT save to the DB — returns the draft to the client, which can show
 * it for review/edit before the user commits.
 */
export async function autofillCompany(
  formData: FormData,
): Promise<{ success: boolean; result?: AutofilledCompany; error?: string }> {
  const name = ((formData.get('name') as string) || '').trim();
  const hintUrl = ((formData.get('hint_url') as string) || '').trim() || undefined;
  if (!name) {
    return { success: false, error: 'Type a company name first.' };
  }
  try {
    const { result } = await autofillCompanyDetails(name, hintUrl);
    return { success: true, result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Auto-fill failed: ${msg}` };
  }
}
