import { getAdapter, listProviders } from './ats';
import type { AtsProvider, DiscoveredPosting } from '@/lib/types';

export interface AtsVerificationResult {
  verified: boolean;
  provider: AtsProvider | null;
  slug: string | null;
  postings: DiscoveredPosting[];
}

function slugVariants(companyName: string, guessedSlug: string | null): string[] {
  const seen = new Set<string>();
  const variants: string[] = [];
  function push(s: string) {
    const cleaned = s.toLowerCase().trim();
    if (cleaned && !seen.has(cleaned)) {
      seen.add(cleaned);
      variants.push(cleaned);
    }
  }
  if (guessedSlug) push(guessedSlug);
  const base = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim();
  const words = base.split(/\s+/);

  push(base.replace(/\s+/g, ''));
  push(base.replace(/\s+/g, '-'));
  push(words[0] ?? '');
  // Common suffixes: "companyinc", "companyhq", "companyio", "companyapp"
  if (words.length === 1) {
    push(words[0] + 'hq');
    push(words[0] + 'inc');
    push(words[0] + 'app');
    push(words[0] + 'io');
  }
  // "the" prefix: "thecompany", "the-company"
  if (words.length >= 2 && words[0] !== 'the') {
    push('the' + base.replace(/\s+/g, ''));
    push('the-' + base.replace(/\s+/g, '-'));
  }
  // Drop "the" if present: "the lego group" → "legogroup", "lego-group"
  if (words[0] === 'the' && words.length >= 2) {
    const rest = words.slice(1);
    push(rest.join(''));
    push(rest.join('-'));
    push(rest[0] ?? '');
  }
  return variants;
}

/**
 * Try a guessed ATS provider + slug and fall through to other providers and
 * slug variants until we find a combo that returns at least one live posting.
 *
 * Note: the current adapters return [] both on 404 and on a valid-but-empty
 * board, so we can't distinguish "wrong slug" from "right slug with zero open
 * roles." For v1, we treat only non-empty responses as "verified" — in
 * practice, Claude suggests companies that are actively hiring, so the false-
 * negative rate on this heuristic is low. Fix later by teaching adapters to
 * return null on HTTP errors.
 *
 * Exhausts up to 4 providers × ~4 slug variants = 16 requests per company in
 * the worst case. Run companies in parallel (Promise.all at call site).
 */
export async function verifyAts(
  companyName: string,
  guessedProvider: AtsProvider | null,
  guessedSlug: string | null,
): Promise<AtsVerificationResult> {
  const providers: AtsProvider[] = guessedProvider
    ? [guessedProvider, ...listProviders().filter((p) => p !== guessedProvider)]
    : listProviders();
  const slugs = slugVariants(companyName, guessedSlug);

  for (const provider of providers) {
    const adapter = getAdapter(provider);
    for (const slug of slugs) {
      try {
        const postings = await adapter.fetchPostings(slug, companyName);
        if (postings.length > 0) {
          return { verified: true, provider, slug, postings };
        }
      } catch {
        // Network error or JSON parse error — try next variant
      }
    }
  }

  return {
    verified: false,
    provider: null,
    slug: null,
    postings: [],
  };
}
