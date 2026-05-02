import Link from 'next/link';
import { getAllApplications, getArchivedApplicationCount } from '@/lib/queries/applications';
import { ApplicationsList } from '@/components/applications/applications-list';
import { PageHeader, LedgerStat, LedgerDivider } from '@/components/layout/editorial';

const INTERVIEW_STATUSES = new Set(['Phone Screen', 'Interview', 'Take Home']);

export default function ApplicationsPage() {
  const applications = getAllApplications();
  const submittedCount = applications.filter((a) => a.current_status === 'Submitted').length;
  const interviewingCount = applications.filter((a) => INTERVIEW_STATUSES.has(a.current_status)).length;
  const archivedCount = getArchivedApplicationCount();

  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="III. Applications"
        title="Letters"
        tail="in the post."
        subtitle="Every application you've sent and what's come back. The ledger of things already in motion."
      />

      <div className="flex items-baseline gap-10 pt-6 border-t border-rule rise" style={{ animationDelay: '60ms' }}>
        <LedgerStat label="In the post" value={applications.length} />
        <LedgerDivider />
        <LedgerStat label="Submitted" value={submittedCount} />
        <LedgerDivider />
        <LedgerStat label="Interviewing" value={interviewingCount} accent={interviewingCount > 0} />
      </div>

      {archivedCount > 0 && (
        <p
          className="font-serif italic text-[13px] text-ink-3 -mt-8 rise"
          style={{ animationDelay: '90ms', fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
        >
          {archivedCount} {archivedCount === 1 ? 'application' : 'applications'} hidden in the{' '}
          <Link href="/archive" className="underline decoration-rule hover:decoration-stamp hover:text-stamp transition-colors">
            archive
          </Link>
          .
        </p>
      )}

      <div className="rise" style={{ animationDelay: '140ms' }}>
        <ApplicationsList applications={applications} />
      </div>
    </div>
  );
}
