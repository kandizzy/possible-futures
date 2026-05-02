'use server';

import { revalidatePath } from 'next/cache';
import { insertCompany, getCompanyByName } from '@/lib/queries/companies';

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
