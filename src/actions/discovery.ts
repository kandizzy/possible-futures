'use server';

import { revalidatePath } from 'next/cache';
import { setCompanyAts, getCompanyById } from '@/lib/queries/companies';
import { markRoleReviewed } from '@/lib/queries/roles';
import { detectAtsFromUrl } from '@/lib/discovery/ats/detect';
import type { AtsProvider } from '@/lib/types';

/**
 * Detect ATS provider + slug for a company by looking at its careers_url.
 * Purely local — no network call, just URL pattern matching.
 */
export async function detectCompanyAts(
  companyId: number,
): Promise<{ success: true; detected: boolean } | { success: false; error: string }> {
  const company = getCompanyById(companyId);
  if (!company) return { success: false, error: 'Company not found.' };
  if (!company.careers_url) {
    return { success: false, error: 'No careers URL on this company.' };
  }
  const detected = detectAtsFromUrl(company.careers_url);
  if (!detected) {
    return { success: true, detected: false };
  }
  setCompanyAts(companyId, detected.provider, detected.slug);
  revalidatePath('/companies');
  return { success: true, detected: true };
}

/**
 * Manual override for ATS config on a company.
 */
export async function setAtsForCompany(formData: FormData): Promise<
  { success: true } | { success: false; error: string }
> {
  const companyId = Number(formData.get('company_id'));
  const provider = formData.get('provider') as AtsProvider | null;
  const slug = formData.get('slug') as string | null;

  if (!Number.isInteger(companyId) || companyId <= 0) {
    return { success: false, error: 'Invalid company id.' };
  }

  const validProviders: AtsProvider[] = ['greenhouse', 'lever', 'ashby', 'workable'];
  if (provider && !validProviders.includes(provider)) {
    return { success: false, error: `Invalid provider: ${provider}` };
  }

  setCompanyAts(companyId, provider || null, slug || null);
  revalidatePath('/companies');
  return { success: true };
}

/**
 * Mark a discovered role as reviewed. Removes it from the Inbox filter.
 */
export async function markDiscoveredRoleReviewed(formData: FormData): Promise<
  { success: true } | { success: false; error: string }
> {
  const roleId = Number(formData.get('role_id'));
  if (!Number.isInteger(roleId) || roleId <= 0) {
    return { success: false, error: 'Invalid role id.' };
  }
  markRoleReviewed(roleId);
  revalidatePath('/');
  revalidatePath(`/roles/${roleId}`);
  return { success: true };
}
