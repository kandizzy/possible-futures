'use client';

import { ChapterShell } from '../chapter-shell';
import { ConfirmRemove } from '../confirm-remove';
import type { IntakeAnswers, IntakeChapter, IntakeEducation } from '@/lib/types';

export function Chapter1Setup({
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
        if (!a.name?.trim()) return 'Please add your name.';
        if (!a.through_line?.trim())
          return 'The through-line is the spine of everything else. One sentence is enough.';
        return null;
      }}
    >
      {({ answers, update }) => (
        <>
          {/* Identity grid */}
          <section>
            <div className="smallcaps text-[9px] text-ink-3 mb-3">Contact</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={answers.name || ''}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Your name *"
                className="field"
              />
              <input
                type="email"
                value={answers.email || ''}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="email@example.com"
                className="field"
              />
              <input
                type="text"
                value={answers.location || ''}
                onChange={(e) => update({ location: e.target.value })}
                placeholder="City, State"
                className="field"
              />
              <input
                type="text"
                value={answers.website || ''}
                onChange={(e) => update({ website: e.target.value })}
                placeholder="yourwebsite.com"
                className="field"
              />
            </div>
          </section>

          {/* Education */}
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <div className="smallcaps text-[9px] text-ink-3">Education</div>
              <button
                type="button"
                onClick={() =>
                  update({
                    education: [
                      ...(answers.education || []),
                      { degree: '', school: '', year: '' },
                    ],
                  })
                }
                className="btn-link"
              >
                + add another
              </button>
            </div>
            <div className="space-y-2">
              {(answers.education || []).length === 0 ? (
                <p
                  className="font-serif italic text-[13px] text-ink-3"
                  style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
                >
                  None listed.{' '}
                  <button
                    type="button"
                    className="btn-link not-italic underline"
                    onClick={() =>
                      update({ education: [{ degree: '', school: '', year: '' }] })
                    }
                  >
                    add your first
                  </button>
                </p>
              ) : (
                (answers.education || []).map((ed, i) => (
                  <EducationRow
                    key={i}
                    education={ed}
                    onChange={(patch) => {
                      const next = [...(answers.education || [])];
                      next[i] = { ...next[i], ...patch };
                      update({ education: next });
                    }}
                    onRemove={() => {
                      const next = [...(answers.education || [])];
                      next.splice(i, 1);
                      update({ education: next });
                    }}
                  />
                ))
              )}
            </div>
          </section>

          {/* Through-line */}
          <section>
            <div className="smallcaps text-[9px] text-ink-3 mb-3">Through-line</div>
            <p
              className="font-serif italic text-[14px] text-ink-2 mb-3 max-w-xl"
              style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
            >
              In one or two sentences, what's the thread that runs through your work? The
              thing you'd keep doing even if the job title changed.
            </p>
            <textarea
              value={answers.through_line || ''}
              onChange={(e) => update({ through_line: e.target.value })}
              rows={3}
              placeholder="I make interfaces that feel less like software and more like instruments you practice."
              className="field w-full font-serif text-[16px] leading-snug resize-y"
              style={{ fontVariationSettings: '"opsz" 16, "SOFT" 30' }}
            />
          </section>

          {/* Current situation */}
          <section>
            <div className="smallcaps text-[9px] text-ink-3 mb-3">Where you are right now</div>
            <p
              className="font-serif italic text-[14px] text-ink-2 mb-3 max-w-xl"
              style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
            >
              One sentence. What's your story at this moment — between roles, just finished
              something, quietly building, actively looking?
            </p>
            <textarea
              value={answers.current_situation || ''}
              onChange={(e) => update({ current_situation: e.target.value })}
              rows={2}
              placeholder="Just finished an MFA, running a small freelance practice, looking for a staff role at a design-forward team."
              className="field w-full font-serif text-[15px] leading-snug resize-y"
              style={{ fontVariationSettings: '"opsz" 15, "SOFT" 30' }}
            />
          </section>
        </>
      )}
    </ChapterShell>
  );
}

function EducationRow({
  education,
  onChange,
  onRemove,
}: {
  education: IntakeEducation;
  onChange: (patch: Partial<IntakeEducation>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr_6rem_auto] gap-2 items-baseline">
      <input
        type="text"
        value={education.degree}
        onChange={(e) => onChange({ degree: e.target.value })}
        placeholder="e.g. BS, MFA, Certificate"
        className="field"
      />
      <input
        type="text"
        value={education.school}
        onChange={(e) => onChange({ school: e.target.value })}
        placeholder="School"
        className="field"
      />
      <input
        type="text"
        value={education.year || ''}
        onChange={(e) => onChange({ year: e.target.value })}
        placeholder="Year"
        className="field font-mono tabular"
      />
      <ConfirmRemove label="×" onConfirm={onRemove} />
    </div>
  );
}
