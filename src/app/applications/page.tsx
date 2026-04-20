import { getAllApplications } from '@/lib/queries/applications';
import { getAllRoles } from '@/lib/queries/roles';
import { ApplicationsList } from '@/components/applications/applications-list';
import { PageHeader, LedgerStat, LedgerDivider } from '@/components/layout/editorial';

export default function ApplicationsPage() {
  const applications = getAllApplications();
  const appliedRoles = getAllRoles('Applied');
  const interviewingRoles = getAllRoles('Interviewing');

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
        <LedgerStat label="Submitted" value={appliedRoles.length} />
        <LedgerDivider />
        <LedgerStat label="Interviewing" value={interviewingRoles.length} accent={interviewingRoles.length > 0} />
      </div>

      <div className="rise" style={{ animationDelay: '140ms' }}>
        <ApplicationsList applications={applications} />
      </div>
    </div>
  );
}
