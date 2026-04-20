import Link from 'next/link';
import { getCompassReadiness } from '@/lib/guards/compass-ready';
import { getReasoningModel } from '@/lib/queries/compass';
import { getAllUsage } from '@/lib/queries/ai-usage';
import { getPendingSuggestions, getLatestBatchMeta } from '@/lib/queries/discovery';
import { PageHeader } from '@/components/layout/editorial';
import { DiscoverClient } from '@/components/discover/discover-client';
import type { VerifiedSuggestion } from '@/actions/discover';
import type { AtsProvider } from '@/lib/types';

export default function DiscoverPage() {
  const readiness = getCompassReadiness();
  const defaultModel = getReasoningModel();

  // Cumulative discovery spend so the user sees historical context
  const allUsage = getAllUsage();
  const discoveryUsage = allUsage.filter((r) => r.operation === 'discover_companies');
  const totalDiscoveryCost = discoveryUsage.reduce((s, r) => s + r.cost_usd, 0);

  if (!readiness.ready) {
    return (
      <div className="space-y-14">
        <PageHeader
          eyebrow="IX. Discover"
          title="Not yet."
          tail="The compass first."
          subtitle="Discovery runs on what you wrote in the compass. The compass isn't ready yet."
        />
        <div className="rise space-y-6" style={{ animationDelay: '80ms' }}>
          <div className="border border-rule bg-paper-2/40 p-6">
            <div className="smallcaps text-[9px] text-ink-3 mb-4">Missing</div>
            <ul className="space-y-2">
              {readiness.missing.map((line, i) => (
                <li
                  key={i}
                  className="font-serif italic text-[14px] text-ink-2 leading-snug"
                  style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
                >
                  — {line}
                </li>
              ))}
            </ul>
          </div>
          <Link href="/onboarding/1" className="btn-stamp inline-block">
            Finish the intake →
          </Link>
        </div>
      </div>
    );
  }

  // Load any pending suggestions from previous sessions
  const pendingRows = getPendingSuggestions();
  const initialSuggestions: VerifiedSuggestion[] = pendingRows.map((row) => ({
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

  const latestBatch = getLatestBatchMeta();

  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="IX. Discover"
        title="Find the"
        tail="next houses."
        subtitle="Claude reads your compass and suggests companies likely to be hiring roles that fit. Every suggestion is verified live against its ATS before it shows up below."
        action={
          totalDiscoveryCost > 0 ? (
            <div className="text-right">
              <div className="font-mono tabular text-[13px] text-ink">
                ${totalDiscoveryCost.toFixed(3)}
              </div>
              <div className="smallcaps text-[8px] text-ink-3 mt-1">
                {discoveryUsage.length} searches
              </div>
            </div>
          ) : undefined
        }
      />
      <DiscoverClient
        defaultModel={defaultModel}
        initialSuggestions={initialSuggestions}
        lastSearchCost={latestBatch?.cost ?? null}
        lastSearchModel={latestBatch?.model ?? null}
      />
    </div>
  );
}
