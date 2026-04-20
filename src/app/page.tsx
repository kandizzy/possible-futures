import { redirect } from 'next/navigation';
import {
  getAllRoles,
  getRolesByCompany,
  getRoleStatusCounts,
  getUnreviewedDiscoveredRoles,
  countUnreviewedDiscovered,
} from '@/lib/queries/roles';
import { getVersionLabelMap } from '@/lib/queries/source-files';
import { isFirstRun } from '@/lib/queries/onboarding';
import { getCompanyByName } from '@/lib/queries/companies';
import { reapOrphanedRuns } from '@/lib/queries/discovery';
import type { RoleStatus } from '@/lib/types';
import { RoleRow } from '@/components/roles/role-row';
import Link from 'next/link';

type FilterOption = RoleStatus | 'All' | 'Discovered';

const STATUS_OPTIONS: FilterOption[] = [
  'All',
  'Discovered',
  'New',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
  'Ghosted',
  'Withdrawn',
  'Skipped',
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string; company?: string }>;
}) {
  if (isFirstRun()) {
    redirect('/onboarding');
  }

  reapOrphanedRuns(10);

  const params = await searchParams;
  const statusFilter = (params.status || 'All') as FilterOption;
  const companyFilter = params.company?.trim() || null;
  const companyRecord = companyFilter ? getCompanyByName(companyFilter) : null;
  const companyName = companyRecord?.name || companyFilter;

  const roles = companyName
    ? getRolesByCompany(companyName, statusFilter === 'All' ? undefined : statusFilter)
    : statusFilter === 'Discovered'
      ? getUnreviewedDiscoveredRoles()
      : getAllRoles(statusFilter === 'All' ? undefined : statusFilter);

  const statusCounts = getRoleStatusCounts();
  const totalRoles = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const applied = statusCounts['Applied'] || 0;
  const interviewing = statusCounts['Interviewing'] || 0;
  const offers = statusCounts['Offer'] || 0;
  const discoveredCount = countUnreviewedDiscovered();
  const versionLabels = getVersionLabelMap();
  return (
    <div className="space-y-14">
      {/* Masthead */}
      <header className="rise">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 md:gap-12">
          <div className="min-w-0 flex-1">
            <div className="smallcaps text-[10px] text-ink-3 mb-3">I. Dashboard</div>
            <h1
              className="font-serif text-[44px] sm:text-[56px] md:text-[72px] leading-[0.88] text-ink tracking-[-0.025em]"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
            >
              An Index of<br />
              <span
                className="italic text-stamp"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}
              >
                Possible Futures.
              </span>
            </h1>
            <p
              className="mt-4 md:mt-6 font-serif text-[15px] md:text-[18px] text-ink-2 leading-snug max-w-xl italic"
              style={{ fontVariationSettings: '"opsz" 18, "SOFT" 40' }}
            >
              A working catalog of roles under consideration.
              Scored, annotated, and kept close at hand.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-4 shrink-0 md:mt-4">
            <Link href="/evaluate" className="btn-stamp">
              <span>＋ Evaluate Role</span>
            </Link>
          </div>
        </div>

        {/* Running totals, ledger style */}
        <div className="mt-8 md:mt-10 flex flex-wrap items-baseline gap-x-8 md:gap-x-10 gap-y-6 pt-6 border-t border-rule">
          <Stat label="Under consideration" value={totalRoles} />
          <Divider />
          <Stat label="Submitted" value={applied} />
          <Divider />
          <Stat label="Interviewing" value={interviewing} accent={interviewing > 0} />
          {offers > 0 && (
            <>
              <Divider />
              <Stat label="Offers" value={offers} accent />
            </>
          )}
        </div>
      </header>

      {/* Company filter breadcrumb */}
      {companyName && (
        <div className="rise flex items-baseline gap-3" style={{ animationDelay: '60ms' }}>
          <span className="smallcaps text-[9px] text-ink-3">Filtered by</span>
          <span
            className="font-serif italic text-[17px] text-ink"
            style={{ fontVariationSettings: '"opsz" 17, "SOFT" 50' }}
          >
            {companyName}
          </span>
          <Link
            href={statusFilter !== 'All' ? `/?status=${statusFilter}` : '/'}
            className="font-mono text-[11px] text-ink-3 hover:text-stamp transition-colors"
          >
            × clear
          </Link>
        </div>
      )}

      {/* Filter bar — underlined table of contents */}
      <div className="rise" style={{ animationDelay: '80ms' }}>
        <div className="smallcaps text-[9px] text-ink-3 mb-3">Filter by status</div>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 pb-3 border-b border-rule">
          {STATUS_OPTIONS.map((s) => {
            const active = statusFilter === s;
            const count =
              s === 'All'
                ? totalRoles
                : s === 'Discovered'
                  ? discoveredCount
                  : statusCounts[s] || 0;
            // Hide the Discovered filter entirely if there's nothing to review
            if (s === 'Discovered' && discoveredCount === 0 && !active) {
              return null;
            }
            const accentDiscovered = s === 'Discovered' && count > 0;
            return (
              <Link
                key={s}
                href={s === 'All' ? '/' : `/?status=${s}`}
                className="group inline-flex items-baseline gap-1.5 relative"
              >
                <span
                  className={`font-serif text-[16px] transition-colors ${
                    active
                      ? 'text-stamp italic'
                      : accentDiscovered
                        ? 'text-stamp group-hover:text-stamp-deep'
                        : 'text-ink-2 group-hover:text-ink'
                  }`}
                  style={{
                    fontVariationSettings: active
                      ? '"opsz" 16, "SOFT" 60'
                      : '"opsz" 16',
                  }}
                >
                  {s}
                </span>
                <span
                  className={`font-mono tabular text-[9px] ${
                    active || accentDiscovered ? 'text-stamp' : 'text-ink-3'
                  }`}
                >
                  {count}
                </span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-stamp"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Catalog */}
      <div className="rise" style={{ animationDelay: '160ms' }}>
        {roles.length === 0 ? (
          <div className="py-24 text-center">
            <p
              className="font-serif italic text-[20px] text-ink-2"
              style={{ fontVariationSettings: '"opsz" 20, "SOFT" 60' }}
            >
              The catalog stands empty.
            </p>
            <Link
              href="/evaluate"
              className="mt-4 inline-block btn-link"
            >
              Evaluate a first role →
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-2">
              <div className="smallcaps text-[9px] text-ink-3">
                {roles.length} {roles.length === 1 ? 'entry' : 'entries'}
                {statusFilter !== 'All' && ` · ${statusFilter}`}
              </div>
              <div className="hidden md:flex smallcaps text-[9px] text-ink-3 gap-8">
                <span>Score</span>
                <span>Status</span>
              </div>
            </div>
            <ol className="divide-y divide-rule-soft border-t border-b border-rule-soft">
              {roles.map((role, i) => (
                <RoleRow
                  key={role.id}
                  role={role}
                  index={i + 1}
                  versionLabels={versionLabels}
                />
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        className={`font-serif tabular text-[36px] md:text-[44px] leading-none tracking-tight ${
          accent ? 'text-stamp' : 'text-ink'
        }`}
        style={{ fontVariationSettings: '"opsz" 60, "SOFT" 40' }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <div className="smallcaps text-[8px] text-ink-3 mt-2">{label}</div>
    </div>
  );
}

function Divider() {
  return <div className="hidden sm:block h-8 md:h-10 w-px bg-rule shrink-0" />;
}
