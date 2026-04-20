import { getAllPeople, getPeopleNeedingAttention } from '@/lib/queries/people';
import { PersonRow } from '@/components/people/person-row';
import { AddPersonForm } from '@/components/people/add-person-form';
import { PageHeader, EmptyState } from '@/components/layout/editorial';

export default function PeoplePage() {
  const people = getAllPeople();
  const needsAttention = getPeopleNeedingAttention(30);
  const needsAttentionIds = new Set(needsAttention.map((p) => p.id));

  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="VI. People"
        title="A book of"
        tail="correspondents."
        subtitle={`${people.length} contacts tracked, ${needsAttention.length} overdue for a note (30+ days since last contact).`}
      />

      <div className="rise" style={{ animationDelay: '80ms' }}>
        <AddPersonForm />
      </div>

      <div className="rise" style={{ animationDelay: '140ms' }}>
        {people.length === 0 ? (
          <EmptyState line="No people tracked yet." />
        ) : (
          <ol className="divide-y divide-rule-soft border-t border-b border-rule-soft">
            {people.map((p) => (
              <PersonRow
                key={p.id}
                person={p}
                needsAttention={needsAttentionIds.has(p.id)}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
