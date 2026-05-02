import Link from 'next/link';
import { getCompaniesWithPipeline, getSkippedCompanies } from '@/lib/queries/companies';
import { PageHeader, EmptyState } from '@/components/layout/editorial';
import { CompanyCard } from '@/components/companies/company-card';
import { WatchlistRow } from '@/components/companies/watchlist-row';
import { AddCompanyButton } from '@/components/companies/add-company-button';
import { SkippedSection } from '@/components/companies/skipped-section';

function urgencySort(a: { interviewing_count: number; offer_count: number; applied_count: number; name: string }, b: typeof a): number {
  const aUrgent = a.interviewing_count + a.offer_count;
  const bUrgent = b.interviewing_count + b.offer_count;
  if (aUrgent !== bUrgent) return bUrgent - aUrgent;
  if (a.applied_count !== b.applied_count) return b.applied_count - a.applied_count;
  return a.name.localeCompare(b.name);
}

export default function CompaniesPage() {
  const all = getCompaniesWithPipeline();
  const skipped = getSkippedCompanies();

  const active = all.filter((c) => c.role_count > 0).sort(urgencySort);
  const watchlist = all.filter((c) => c.role_count === 0);

  const interviewingCompanies = active.filter((c) => c.interviewing_count > 0 || c.offer_count > 0).length;
  const verifiedCount = all.filter((c) => c.ats_provider && c.ats_slug).length;

  // Group watchlist by category
  const watchlistGrouped: Record<string, typeof watchlist> = {};
  for (const c of watchlist) {
    const cat = c.category || 'Uncategorized';
    if (!watchlistGrouped[cat]) watchlistGrouped[cat] = [];
    watchlistGrouped[cat].push(c);
  }

  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="IV. Companies"
        title="The"
        tail="houses."
        subtitle={`${all.length} ${all.length === 1 ? 'house' : 'houses'}${active.length > 0 ? `, ${active.length} with active pipeline` : ''}.`}
        action={
          <div className="flex items-center gap-3">
            <AddCompanyButton />
            <Link href="/discover" className="btn-stamp">
              Discover more →
            </Link>
          </div>
        }
      />

      {/* Ledger stats */}
      <div className="rise flex flex-wrap items-baseline gap-x-8 md:gap-x-10 gap-y-6 pt-6 border-t border-rule" style={{ animationDelay: '60ms' }}>
        <Stat label="Total" value={all.length} />
        <StatDivider />
        <Stat label="Active pipeline" value={active.length} />
        <StatDivider />
        <Stat label="Interviewing" value={interviewingCompanies} accent={interviewingCompanies > 0} />
        <StatDivider />
        <Stat label="ATS verified" value={verifiedCount} />
      </div>

      {all.length === 0 ? (
        <EmptyState
          line="No companies tracked yet."
          actionLabel="Discover companies →"
          actionHref="/discover"
        />
      ) : (
        <div className="space-y-14 rise" style={{ animationDelay: '120ms' }}>
          {/* Active Pipeline */}
          {active.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between mb-5 pb-2 border-b border-rule">
                <h2 className="smallcaps text-[10px] text-ink-3">Active pipeline</h2>
                <span className="font-mono tabular text-[10px] text-ink-3">
                  {String(active.length).padStart(2, '0')}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map((c) => (
                  <CompanyCard key={c.id} company={c} />
                ))}
              </div>
            </section>
          )}

          {/* Watchlist */}
          {watchlist.length > 0 && (
            <section>
              <details open={watchlist.length < 10}>
                <summary className="flex items-baseline justify-between pb-2 border-b border-rule cursor-pointer list-none [&::-webkit-details-marker]:hidden marker:hidden outline-none select-none">
                  <h2 className="smallcaps text-[10px] text-ink-3">
                    Watchlist
                    <span className="font-mono tabular text-[10px] text-ink-3 ml-2">
                      {String(watchlist.length).padStart(2, '0')}
                    </span>
                  </h2>
                  <span className="font-serif italic text-[12px] text-ink-3 hover:text-stamp transition-colors cursor-pointer underline decoration-rule hover:decoration-stamp">
                    toggle
                  </span>
                </summary>
                <div className="mt-5"></div>

                <div className="space-y-8">
                  {Object.entries(watchlistGrouped).map(([category, cos]) => (
                    <div key={category}>
                      <div className="flex items-baseline justify-between mb-2">
                        <h3
                          className="font-serif italic text-[17px] text-ink tracking-[-0.01em]"
                          style={{ fontVariationSettings: '"opsz" 18, "SOFT" 60' }}
                        >
                          {category}
                        </h3>
                        <span className="font-mono tabular text-[9px] text-ink-3">
                          {String(cos.length).padStart(2, '0')}
                        </span>
                      </div>
                      <ol className="divide-y divide-rule-soft">
                        {cos.map((c) => (
                          <WatchlistRow key={c.id} company={c} />
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </details>
            </section>
          )}

          {/* Skipped — companies dismissed during Discover, with restore */}
          <SkippedSection companies={skipped} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <div
        className={`font-serif tabular text-[34px] md:text-[40px] leading-none tracking-tight ${accent ? 'text-stamp' : 'text-ink'}`}
        style={{ fontVariationSettings: '"opsz" 48, "SOFT" 40' }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <div className="smallcaps text-[8px] text-ink-3 mt-2">{label}</div>
    </div>
  );
}

function StatDivider() {
  return <div className="hidden sm:block h-8 md:h-10 w-px bg-rule shrink-0" />;
}
