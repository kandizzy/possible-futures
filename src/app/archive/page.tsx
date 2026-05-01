import Link from 'next/link';
import { getArchivedRoles } from '@/lib/queries/roles';
import { getApplicationByRoleId } from '@/lib/queries/applications';
import { getVersionLabelMap } from '@/lib/queries/source-files';
import { PageHeader, EmptyState, LedgerStat, LedgerDivider } from '@/components/layout/editorial';
import { RoleRow } from '@/components/roles/role-row';

const INTERVIEW_STATUSES = new Set(['Phone Screen', 'Interview', 'Take Home']);

function monthLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Undated';
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export default async function ArchivePage() {
  const roles = getArchivedRoles();
  const versionLabels = getVersionLabelMap();

  // Pull each archived role's application status (if any) so we can compute
  // the "what happened along the way" stats without another aggregate query.
  const apps = roles.map((r) => getApplicationByRoleId(r.id));
  const submittedCount = apps.filter((a) => a && a.current_status === 'Submitted').length;
  const interviewedCount = apps.filter((a) => a && INTERVIEW_STATUSES.has(a.current_status)).length;
  const offerCount = apps.filter((a) => a && a.current_status === 'Offer').length;

  // Group by archive month
  const groups = new Map<string, typeof roles>();
  for (const r of roles) {
    const key = monthLabel(r.date_archived || r.date_added);
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="The Archive"
        title="Roles set"
        tail="aside."
        subtitle="The full record. Every posting you considered, kept here so the journey stays visible — even the ones you moved on from."
        action={
          <Link
            href="/"
            className="font-serif italic text-[13px] text-ink-2 hover:text-stamp transition-colors"
            style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
          >
            ← back to dashboard
          </Link>
        }
      />

      {roles.length === 0 ? (
        <EmptyState line="Nothing archived yet." actionLabel="Back to dashboard" actionHref="/" />
      ) : (
        <div className="space-y-12 rise" style={{ animationDelay: '80ms' }}>
          {/* Framing stats — the journey turned into evidence */}
          <div className="pt-6 border-t border-rule">
            <div className="flex flex-wrap items-baseline gap-x-10 gap-y-6">
              <LedgerStat label="Considered" value={roles.length} />
              <LedgerDivider />
              <LedgerStat label="Submitted" value={submittedCount} />
              <LedgerDivider />
              <LedgerStat
                label="Interviewed"
                value={interviewedCount}
                accent={interviewedCount > 0}
              />
              {offerCount > 0 && (
                <>
                  <LedgerDivider />
                  <LedgerStat label="Offers" value={offerCount} accent />
                </>
              )}
            </div>
            <p
              className="mt-6 font-serif italic text-[14px] text-ink-2 leading-snug max-w-2xl"
              style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
            >
              This is the labor that doesn&apos;t fit on a resume. Some of these roles
              you set aside. Some set you aside. Some never wrote back at all. The
              work of a job search lives in all of it — the reading, the weighing,
              the writing, the waiting. Kept here so you can return to it later, trace
              the patterns, and draw the shape of your search.
            </p>
          </div>
          {Array.from(groups.entries()).map(([month, group]) => (
            <section key={month} className="space-y-3">
              <div className="flex items-baseline gap-3 pb-2 border-b border-rule-soft">
                <h2
                  className="font-serif text-[22px] text-ink italic"
                  style={{ fontVariationSettings: '"opsz" 22, "SOFT" 60' }}
                >
                  {month}
                </h2>
                <span className="font-mono tabular text-[10px] text-ink-3">
                  {String(group.length).padStart(2, '0')} {group.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
              <ol className="divide-y divide-rule-soft border-t border-b border-rule-soft archive-list">
                {group.map((role, i) => (
                  <RoleRow
                    key={role.id}
                    role={role}
                    index={i + 1}
                    versionLabels={versionLabels}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
