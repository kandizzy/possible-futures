import type { AtsProvider } from '@/lib/types';

/**
 * Attempt to infer an ATS provider and slug from a company's careers_url.
 * Pure function — no network call. Returns null if nothing matches.
 *
 * Common patterns we recognize:
 *   https://boards.greenhouse.io/anthropic               → greenhouse / anthropic
 *   https://job-boards.greenhouse.io/anthropic/jobs/...  → greenhouse / anthropic
 *   https://anthropic.com/careers (no match, returns null)
 *   https://jobs.lever.co/figma                           → lever / figma
 *   https://jobs.ashbyhq.com/linear                       → ashby / linear
 *   https://apply.workable.com/teenage-engineering        → workable / teenage-engineering
 */
export function detectAtsFromUrl(
  careersUrl: string | null | undefined,
): { provider: AtsProvider; slug: string } | null {
  if (!careersUrl) return null;
  let url: URL;
  try {
    url = new URL(careersUrl);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);

  // Greenhouse
  if (host.endsWith('greenhouse.io')) {
    // boards.greenhouse.io/slug or job-boards.greenhouse.io/slug/... or boards-api.greenhouse.io/v1/boards/slug/jobs
    if (host === 'boards-api.greenhouse.io') {
      // path like /v1/boards/{slug}/jobs
      const boardsIdx = segments.indexOf('boards');
      const slug = boardsIdx >= 0 ? segments[boardsIdx + 1] : undefined;
      if (slug) return { provider: 'greenhouse', slug };
    }
    const slug = segments[0];
    if (slug) return { provider: 'greenhouse', slug };
  }

  // Lever
  if (host === 'jobs.lever.co' || host === 'api.lever.co') {
    // jobs.lever.co/{slug} or api.lever.co/v0/postings/{slug}
    const slug = host === 'api.lever.co'
      ? segments[segments.indexOf('postings') + 1]
      : segments[0];
    if (slug) return { provider: 'lever', slug };
  }

  // Ashby
  if (host === 'jobs.ashbyhq.com' || host.endsWith('.ashbyhq.com')) {
    const slug = segments[0];
    if (slug) return { provider: 'ashby', slug };
  }

  // Workable
  if (host === 'apply.workable.com' || host.endsWith('.workable.com')) {
    const slug = segments[0];
    if (slug && slug !== 'api') return { provider: 'workable', slug };
  }

  return null;
}
