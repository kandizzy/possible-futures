'use server';

import { revalidatePath } from 'next/cache';
import {
  insertCompany,
  getCompanyByName,
  getCompanyById,
  unskipCompany as unskipCompanyDb,
  skipCompanyById as skipCompanyByIdDb,
  deleteCompanyById as deleteCompanyByIdDb,
} from '@/lib/queries/companies';
import { getDb } from '@/lib/db';
import { autofillCompanyDetails, type AutofilledCompany } from '@/lib/ai/autofill-company';
import { getAdapter } from '@/lib/discovery/ats';
import { matchPostings } from '@/lib/discovery/match-titles';
import { scorePosting } from '@/lib/ai/scoring';
import { insertRole, getRoleUrls } from '@/lib/queries/roles';
import type { AtsProvider } from '@/lib/types';

const VALID_ATS: AtsProvider[] = ['greenhouse', 'lever', 'ashby', 'workable'];

function parseAtsProvider(raw: string | null): AtsProvider | undefined {
  if (!raw) return undefined;
  const v = raw.trim();
  return (VALID_ATS as string[]).includes(v) ? (v as AtsProvider) : undefined;
}

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
  const ats_provider = parseAtsProvider(formData.get('ats_provider') as string | null);
  const ats_slug = ((formData.get('ats_slug') as string) || '').trim() || undefined;

  const id = insertCompany({
    name,
    category,
    why_interested,
    careers_url,
    ats_provider,
    ats_slug,
    source: 'manual',
  });

  revalidatePath('/companies');
  revalidatePath('/discover');
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
  const ats_provider = parseAtsProvider(formData.get('ats_provider') as string | null) ?? null;
  const ats_slug = ((formData.get('ats_slug') as string) || '').trim() || null;

  const db = getDb();
  db.prepare(
    `UPDATE companies SET category = ?, why_interested = ?, careers_url = ?, ats_provider = ?, ats_slug = ? WHERE id = ?`,
  ).run(category, why_interested, careers_url, ats_provider, ats_slug, id);

  revalidatePath('/companies');
  revalidatePath('/discover');
  return { success: true };
}

// ----- See roles flow ----------------------------------------------------

export interface CompanyPosting {
  /** Stable index used by the picker to identify which postings are selected. */
  index: number;
  title: string;
  url: string | null;
  location: string | null;
  salary_range: string | null;
  posting_text: string;
  /** Title matched the user's compass signal/dream — surfaced in the UI. */
  matched: boolean;
  /** Already scored — can't be re-scored, shown as an existing role link. */
  alreadyScored: boolean;
}

export async function fetchCompanyPostings(
  companyId: number,
): Promise<{ ok: boolean; error?: string; postings?: CompanyPosting[]; companyName?: string }> {
  const company = getCompanyById(companyId);
  if (!company) return { ok: false, error: 'Company not found.' };
  if (!company.ats_provider || !company.ats_slug) {
    return {
      ok: false,
      error: `No ATS configured for ${company.name}. Edit the company and add provider + slug, then try again.`,
    };
  }

  // IMPORTANT: don't use verifyAts here. verifyAts iterates *all* providers
  // and slug variants until it finds a board with postings, which silently
  // hides slug-mismatch bugs (e.g., ashby/runwayml returns 0 → falls
  // through to greenhouse/runway, which is a different "Runway" company,
  // and you score postings for the wrong company). For an existing company
  // with explicit ATS settings, use the configured (provider, slug) only.
  const adapter = getAdapter(company.ats_provider as AtsProvider);
  let rawPostings;
  try {
    rawPostings = await adapter.fetchPostings(company.ats_slug, company.name);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: `Failed to fetch from ${company.ats_provider}/${company.ats_slug}: ${msg}`,
    };
  }

  // Highlight titles that match the user's compass for easier picking.
  const previews = matchPostings(
    rawPostings.map((p, i) => ({
      id: i,
      title: p.title,
      url: p.url || null,
      location: p.location || null,
    })),
  );
  const matchedById = new Map(previews.map((p) => [p.cache_id, p.matched]));

  // Mark postings whose URL already exists as a role so the user can see what
  // they've already scored at this company.
  const existingUrls = new Set(getRoleUrls());

  const postings: CompanyPosting[] = rawPostings.map((p, i) => ({
    index: i,
    title: p.title,
    url: p.url || null,
    location: p.location || null,
    salary_range: p.salary_range || null,
    posting_text: p.posting_text || '',
    matched: matchedById.get(i) ?? false,
    alreadyScored: !!(p.url && existingUrls.has(p.url)),
  }));

  // Matched + not-yet-scored first, then everything else alphabetical.
  postings.sort((a, b) => {
    if (a.alreadyScored !== b.alreadyScored) return a.alreadyScored ? 1 : -1;
    if (a.matched !== b.matched) return a.matched ? -1 : 1;
    return a.title.localeCompare(b.title);
  });

  return { ok: true, postings, companyName: company.name };
}

export async function scoreCompanyPostings(
  companyId: number,
  selectedIndices: number[],
  postings: CompanyPosting[],
): Promise<{ ok: boolean; error?: string; scored?: number }> {
  const company = getCompanyById(companyId);
  if (!company) return { ok: false, error: 'Company not found.' };

  const selectedSet = new Set(selectedIndices);
  const toScore = postings.filter((p) => selectedSet.has(p.index) && !p.alreadyScored);

  const existingUrls = new Set(getRoleUrls());
  let scored = 0;
  for (const posting of toScore) {
    if (posting.url && existingUrls.has(posting.url)) continue;
    try {
      const scoring = await scorePosting(
        posting.posting_text,
        undefined,
        { type: 'role' },
        posting.url || undefined,
      );
      insertRole({
        title: posting.title || scoring.role_title || 'Untitled',
        company: scoring.company || company.name,
        url: posting.url || undefined,
        posting_text: posting.posting_text || undefined,
        salary_range: posting.salary_range || scoring.salary_range || undefined,
        location: posting.location || scoring.location || undefined,
        ai_scores: scoring.scores,
        ai_recommendation: scoring.recommendation,
        recommended_resume_version: scoring.recommended_resume_version,
        signal_words_found: scoring.signal_words_found,
        red_flags_found: scoring.red_flags_found,
        fit_summary: scoring.fit_summary,
        gap_analysis: scoring.gap_analysis,
        status: 'New',
        source: 'discovered',
      });
      scored++;
    } catch (err) {
      console.warn(`[scoreCompanyPostings] failed to score "${posting.title}":`, err);
    }
  }

  revalidatePath('/');
  revalidatePath('/companies');
  return { ok: true, scored };
}

/**
 * Soft-archive: stamps `skipped_at` on the company so it disappears from
 * Active Pipeline / Watchlist views and gets excluded from future Discover
 * suggestions. The row stays in the DB and can be restored from the Skipped
 * section, or permanently removed via `deleteCompany`.
 */
export async function skipCompany(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const id = Number(formData.get('id'));
  if (!id || !Number.isInteger(id)) {
    return { success: false, error: 'A valid company id is required.' };
  }
  skipCompanyByIdDb(id);
  revalidatePath('/companies');
  revalidatePath('/discover');
  return { success: true };
}

/**
 * Hard delete. Only intended for use after the company is already skipped
 * — the UI surfaces this as a "delete forever" button on the Skipped row,
 * gated by a confirmation modal so accidents are unlikely. Roles reference
 * companies by name (TEXT), not by id, so deleting a company doesn't cascade
 * to roles; orphaned role.company text remains intact.
 */
export async function deleteCompany(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const id = Number(formData.get('id'));
  if (!id || !Number.isInteger(id)) {
    return { success: false, error: 'A valid company id is required.' };
  }
  deleteCompanyByIdDb(id);
  revalidatePath('/companies');
  revalidatePath('/discover');
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
