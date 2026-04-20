'use client';

import { ChapterShell } from '../chapter-shell';
import { RoleCard } from '../role-card';
import type { IntakeAnswers, IntakeChapter, IntakeRole } from '@/lib/types';

function emptyRole(): IntakeRole {
  return {
    id: crypto.randomUUID(),
    title: '',
    company: '',
    start: '',
    summary: '',
    proudest: '',
  };
}

export function Chapter2Throughline({
  chapter,
  initialAnswers,
}: {
  chapter: IntakeChapter;
  initialAnswers: IntakeAnswers;
}) {
  return (
    <ChapterShell
      chapter={chapter}
      initialAnswers={initialAnswers}
      canAdvance={(a) => {
        const roles = a.roles || [];
        if (roles.length < 2)
          return 'Add at least two roles to draw a throughline.';
        const complete = roles.filter(
          (r) =>
            r.title.trim() &&
            r.company.trim() &&
            r.summary.trim() &&
            (r.proudest.trim() || /previous experience|multiple/i.test(r.title + r.company)),
        );
        if (complete.length < 2) {
          return 'At least two roles need a title, company, summary, and proudest moment filled in.';
        }
        return null;
      }}
    >
      {({ answers, update }) => {
        const roles = answers.roles || [];

        function updateRole(index: number, patch: Partial<IntakeRole>) {
          const next = [...roles];
          next[index] = { ...next[index], ...patch };
          update({ roles: next });
        }

        function removeRole(index: number) {
          const next = [...roles];
          next.splice(index, 1);
          update({ roles: next });
        }

        function moveRole(index: number, direction: -1 | 1) {
          const target = index + direction;
          if (target < 0 || target >= roles.length) return;
          const next = [...roles];
          [next[index], next[target]] = [next[target], next[index]];
          update({ roles: next });
        }

        function addRole() {
          update({ roles: [...roles, emptyRole()] });
        }

        return (
          <>
            <p
              className="font-serif italic text-[15px] text-ink-2 max-w-2xl"
              style={{ fontVariationSettings: '"opsz" 15, "SOFT" 40' }}
            >
              Start with the most recent and work backwards. A role can be a job, a residency,
              a freelance stretch, a contract. Three is the minimum; five or six is better.
              The &ldquo;messy notes&rdquo; field is where you dump what you actually remember
              — fragments, numbers, hard things you solved. Nobody sees that text except the AI
              that drafts your materials later.
            </p>

            <div className="space-y-5">
              {roles.map((role, i) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  index={i}
                  onChange={(patch) => updateRole(i, patch)}
                  onRemove={() => removeRole(i)}
                  onMoveUp={i > 0 ? () => moveRole(i, -1) : undefined}
                  onMoveDown={i < roles.length - 1 ? () => moveRole(i, 1) : undefined}
                />
              ))}
            </div>

            <div className="flex items-baseline justify-between pt-2">
              <p
                className="font-serif italic text-[13px] text-ink-3"
                style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
              >
                {roles.length === 0 && 'No roles yet. Add your first.'}
                {roles.length === 1 && '1 of 2 minimum added.'}
                {roles.length >= 2 && `${roles.length} roles on the shelf. Add more if you like.`}
              </p>
              <button type="button" onClick={addRole} className="btn-ghost">
                + add a role
              </button>
            </div>
          </>
        );
      }}
    </ChapterShell>
  );
}
