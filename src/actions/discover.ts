'use server';

import { revalidatePath } from 'next/cache';
import { discoverCompanies, type SuggestedCompany } from '@/lib/ai/discover-companies';
import { verifyAts } from '@/lib/discovery/verify-ats';
import {
  insertCompany,
  getCompanyByName,
  markCompanySkipped,
  setCompanyAts,
  updateCompanyLastScanned,
} from '@/lib/queries/companies';
import {
  insertSuggestionBatch,
  getSuggestionByName,
  getCachedPostings,
  markSuggestionTracked,
  markSuggestionSkipped as markSuggestionSkippedDb,
} from '@/lib/queries/discovery';
import { insertRole, getRoleUrls } from '@/lib/queries/roles';
import { scorePosting } from '@/lib/ai/scoring';
import { isCompassReady } from '@/lib/guards/compass-ready';
import type { AtsProvider } from '@/lib/types';

export interface VerifiedSuggestion extends SuggestedCompany {
  id: number;
  verified: boolean;
  verified_provider: AtsProvider | null;
  verified_slug: string | null;
  open_postings_count: number;
}

export interface SuggestCompaniesResult {
  ok: boolean;
  error?: string;
  suggestions?: VerifiedSuggestion[];
  cost_usd?: number;
  model?: string;
}

export async function suggestCompaniesAction(formData: FormData): Promise<SuggestCompaniesResult> {
  if (!isCompassReady()) {
    return { ok: false, error: 'Compass is not ready. Finish the intake first.' };
  }

  const roleType = (formData.get('role_type') as string | null)?.trim() || undefined;
  const modelOverride = (formData.get('model') as string | null) || undefined;

  let suggestions: SuggestedCompany[];
  let cost = 0;
  let model = '';
  try {
    const result = await discoverCompanies({ roleType, modelOverride });
    suggestions = result.suggestions;
    cost = result.cost;
    model = result.model;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Claude call failed: ${msg}` };
  }

  const batchId = crypto.randomUUID();

  const verified = await Promise.all(
    suggestions.map(async (s) => {
      const v = await verifyAts(s.name, s.guessed_ats_provider, s.guessed_ats_slug);
      return {
        ...s,
        verified: v.verified,
        verified_provider: v.provider,
        verified_slug: v.slug,
        open_postings: v.postings.length,
        postings: v.postings,
      };
    }),
  );

  // Persist the entire batch to the database
  insertSuggestionBatch(
    batchId,
    verified.map((v) => ({
      name: v.name,
      category: v.category,
      why_fits: v.why_fits,
      careers_url: v.careers_url,
      verified: v.verified,
      verified_provider: v.verified_provider,
      verified_slug: v.verified_slug,
      open_postings: v.open_postings,
      postings: v.postings.map((p) => ({
        title: p.title,
        url: p.url,
        location: p.location || undefined,
        salary_range: p.salary_range || undefined,
        posting_text: p.posting_text,
      })),
    })),
    model,
    cost,
    roleType,
  );

  // Re-read from DB to get the row IDs
  const { getPendingSuggestions } = await import('@/lib/queries/discovery');
  const rows = getPendingSuggestions().filter((r) => r.batch_id === batchId);

  const clientResults: VerifiedSuggestion[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category || '',
    why_fits: row.why_fits || '',
    guessed_ats_provider: null,
    guessed_ats_slug: null,
    careers_url: row.careers_url,
    verified: !!row.verified,
    verified_provider: row.verified_provider as AtsProvider | null,
    verified_slug: row.verified_slug,
    open_postings_count: row.open_postings,
  }));

  revalidatePath('/discover');
  return { ok: true, suggestions: clientResults, cost_usd: cost, model };
}

// Step 1: Preview which postings match the compass before committing
export interface PostingPreviewItem {
  cache_id: number;
  title: string;
  url: string | null;
  location: string | null;
  matched: boolean;
}

export interface PreviewTrackResult {
  ok: boolean;
  error?: string;
  postings?: PostingPreviewItem[];
}

export async function previewTrackPostings(suggestionId: number): Promise<PreviewTrackResult> {
  const { getSuggestionById } = await import('@/lib/queries/discovery');
  const suggestion = getSuggestionById(suggestionId);
  if (!suggestion || suggestion.status !== 'pending') {
    return { ok: false, error: 'Suggestion not found or already processed.' };
  }

  const cached = getCachedPostings(suggestion.id);
  if (cached.length === 0) {
    return { ok: true, postings: [] };
  }

  const { matchPostings } = await import('@/lib/discovery/match-titles');
  const previews = matchPostings(
    cached.map((p) => ({ id: p.id, title: p.title, url: p.url, location: p.location })),
  );

  // Matched first, then unmatched — both alphabetical within group
  previews.sort((a, b) => {
    if (a.matched !== b.matched) return a.matched ? -1 : 1;
    return a.title.localeCompare(b.title);
  });

  return { ok: true, postings: previews };
}

// Step 2: Track the company and score only selected postings
export interface TrackSuggestedResult {
  ok: boolean;
  error?: string;
  company_id?: number;
  postings_scored?: number;
}

export async function confirmTrackCompany(
  suggestionId: number,
  selectedCacheIds: number[],
): Promise<TrackSuggestedResult> {
  const { getSuggestionById } = await import('@/lib/queries/discovery');
  const suggestion = getSuggestionById(suggestionId);
  if (!suggestion || suggestion.status !== 'pending') {
    return { ok: false, error: 'Suggestion not found or already processed.' };
  }

  const provider = suggestion.verified_provider as AtsProvider | null;
  const slug = suggestion.verified_slug;

  // Insert or find the company
  const existing = getCompanyByName(suggestion.name);
  let companyId: number;
  if (existing) {
    companyId = existing.id;
    if ((!existing.ats_provider || !existing.ats_slug) && provider && slug) {
      setCompanyAts(companyId, provider, slug);
    }
  } else {
    companyId = insertCompany({
      name: suggestion.name,
      category: suggestion.category || undefined,
      why_interested: suggestion.why_fits || undefined,
      careers_url: suggestion.careers_url || undefined,
      ats_provider: provider || undefined,
      ats_slug: slug || undefined,
      source: 'claude_suggestion',
    });
  }

  // Score only the user-selected postings
  const selectedSet = new Set(selectedCacheIds);
  const allCached = getCachedPostings(suggestion.id);
  const toScore = allCached.filter((p) => selectedSet.has(p.id));

  const existingUrls = new Set(getRoleUrls());
  let scored = 0;
  for (const posting of toScore) {
    if (posting.url && existingUrls.has(posting.url)) continue;
    try {
      const scoring = await scorePosting(posting.posting_text || '', undefined, {
        type: 'role',
      });
      insertRole({
        title: posting.title || scoring.role_title || 'Untitled',
        company: scoring.company || suggestion.name,
        url: posting.url || undefined,
        posting_text: posting.posting_text || undefined,
        salary_range: posting.salary || scoring.salary_range || undefined,
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
      console.warn(`[confirmTrackCompany] failed to score ${posting.title}:`, err);
    }
  }

  updateCompanyLastScanned(companyId);
  markSuggestionTracked(suggestion.id);

  revalidatePath('/');
  revalidatePath('/companies');
  revalidatePath('/discover');
  return { ok: true, company_id: companyId, postings_scored: scored };
}

export async function skipSuggestedCompany(suggestionId: number): Promise<{ ok: boolean }> {
  const { getSuggestionById } = await import('@/lib/queries/discovery');
  const suggestion = getSuggestionById(suggestionId);
  if (suggestion) {
    markCompanySkipped(suggestion.name);
    markSuggestionSkippedDb(suggestion.id);
  }
  revalidatePath('/discover');
  return { ok: true };
}

export interface ReverifyResult {
  ok: boolean;
  checked: number;
  newlyVerified: number;
  totalPostings: number;
}

export async function reverifyPendingSuggestions(): Promise<ReverifyResult> {
  const {
    getUnverifiedPendingSuggestions,
    updateSuggestionVerification,
  } = await import('@/lib/queries/discovery');

  const unverified = getUnverifiedPendingSuggestions();
  if (unverified.length === 0) {
    return { ok: true, checked: 0, newlyVerified: 0, totalPostings: 0 };
  }

  let newlyVerified = 0;
  let totalPostings = 0;

  // Run all verifications in parallel
  const results = await Promise.all(
    unverified.map(async (s) => {
      const v = await verifyAts(s.name, null, null);
      return { suggestion: s, verification: v };
    }),
  );

  for (const { suggestion, verification } of results) {
    if (verification.verified && verification.provider && verification.slug) {
      updateSuggestionVerification(
        suggestion.id,
        true,
        verification.provider as AtsProvider,
        verification.slug,
        verification.postings.map((p) => ({
          title: p.title,
          url: p.url,
          location: p.location || undefined,
          salary_range: p.salary_range || undefined,
          posting_text: p.posting_text,
        })),
      );
      newlyVerified++;
      totalPostings += verification.postings.length;
    }
  }

  revalidatePath('/discover');
  return { ok: true, checked: unverified.length, newlyVerified, totalPostings };
}

export async function addCompanyManually(formData: FormData): Promise<{ ok: boolean; error?: string; company_id?: number }> {
  const name = (formData.get('name') as string | null)?.trim();
  if (!name) return { ok: false, error: 'Name is required.' };

  const existing = getCompanyByName(name);
  if (existing) {
    return { ok: false, error: `A company named "${name}" already exists.` };
  }

  const category = (formData.get('category') as string | null)?.trim() || undefined;
  const whyInterested = (formData.get('why_interested') as string | null)?.trim() || undefined;
  const careersUrl = (formData.get('careers_url') as string | null)?.trim() || undefined;
  const atsProviderRaw = (formData.get('ats_provider') as string | null)?.trim();
  const atsSlug = (formData.get('ats_slug') as string | null)?.trim() || undefined;

  const atsProvider =
    atsProviderRaw && ['greenhouse', 'lever', 'ashby', 'workable'].includes(atsProviderRaw)
      ? (atsProviderRaw as AtsProvider)
      : undefined;

  const companyId = insertCompany({
    name,
    category,
    why_interested: whyInterested,
    careers_url: careersUrl,
    ats_provider: atsProvider,
    ats_slug: atsSlug,
    source: 'manual',
  });

  revalidatePath('/companies');
  revalidatePath('/discover');
  return { ok: true, company_id: companyId };
}
