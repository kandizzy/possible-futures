'use client';

import { ChapterShell } from '../chapter-shell';
import { ChipPicker } from '../chip-picker';
import type {
  IntakeAnswers,
  IntakeChapter,
  IntakeProject,
  IntakeVersion,
} from '@/lib/types';
import { INTAKE_DEFAULTS } from '@/lib/onboarding/compile';
import { ConfirmRemove } from '../confirm-remove';

const ALL_LETTERS = 'ABCDEFGH';

function nextLetter(versions: IntakeVersion[]): string {
  const used = new Set(versions.map((v) => v.letter));
  for (const l of ALL_LETTERS) {
    if (!used.has(l)) return l;
  }
  return String.fromCharCode(65 + versions.length);
}

function emptyProject(): IntakeProject {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    serves_versions: [],
  };
}

export function Chapter5ShelfOfProof({
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
        const projects = a.projects || [];
        if (projects.length < 3)
          return 'Add at least three projects. They can be side projects, work projects, anything you did with your own hands.';
        for (const p of projects) {
          if (!p.title.trim() || !p.description.trim()) {
            return 'Each project needs a title and a one-sentence description.';
          }
        }
        return null;
      }}
      nextLabel="Ready to publish →"
    >
      {({ answers, update }) => {
        const projects = answers.projects || [];
        const versions: IntakeVersion[] = answers.versions || INTAKE_DEFAULTS.versions;

        function updateProject(index: number, patch: Partial<IntakeProject>) {
          const next = [...projects];
          next[index] = { ...next[index], ...patch };
          update({ projects: next });
        }

        function removeProject(index: number) {
          const next = [...projects];
          next.splice(index, 1);
          update({ projects: next });
        }

        function addProject() {
          update({ projects: [...projects, emptyProject()] });
        }

        function toggleServesVersion(projectIdx: number, letter: string) {
          const p = projects[projectIdx];
          const current = p.serves_versions || [];
          const next = current.includes(letter)
            ? current.filter((l) => l !== letter)
            : [...current, letter];
          updateProject(projectIdx, { serves_versions: next });
        }

        function updateVersion(letter: string, patch: Partial<IntakeVersion>) {
          const next = versions.map((v) => (v.letter === letter ? { ...v, ...patch } : v));
          update({ versions: next });
        }

        function addVersion() {
          const letter = nextLetter(versions);
          update({ versions: [...versions, { letter, label: '', emphasis: '' }] });
        }

        function removeVersion(letter: string) {
          update({ versions: versions.filter((v) => v.letter !== letter) });
        }

        return (
          <>
            <p
              className="font-serif italic text-[15px] text-ink-2 max-w-2xl"
              style={{ fontVariationSettings: '"opsz" 15, "SOFT" 40' }}
            >
              The shelf of proof. Work you're willing to point at when someone asks. For each
              project, tap the resume versions it should serve — the same project can serve
              more than one.
            </p>

            {/* Projects */}
            <section>
              <div className="smallcaps text-[9px] text-ink-3 mb-3">Projects</div>
              <div className="space-y-4">
                {projects.map((p, i) => (
                  <div key={p.id} className="p-5 border border-rule bg-paper-2/30 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div className="smallcaps text-[9px] text-ink-3">
                        Project № {String(i + 1).padStart(2, '0')}
                      </div>
                      <ConfirmRemove onConfirm={() => removeProject(i)} />
                    </div>
                    <input
                      type="text"
                      value={p.title}
                      onChange={(e) => updateProject(i, { title: e.target.value })}
                      placeholder="Title"
                      className="field w-full"
                    />
                    <textarea
                      value={p.description}
                      onChange={(e) => updateProject(i, { description: e.target.value })}
                      rows={2}
                      placeholder="One sentence. What is it and why does it matter?"
                      className="field w-full font-serif text-[14px] resize-y"
                      style={{ fontVariationSettings: '"opsz" 14, "SOFT" 30' }}
                    />
                    <input
                      type="text"
                      value={p.stack || ''}
                      onChange={(e) => updateProject(i, { stack: e.target.value })}
                      placeholder="Stack (optional)"
                      className="field w-full"
                    />
                    {/* Versions served */}
                    <div>
                      <div className="smallcaps text-[8px] text-ink-3 mb-2">
                        Serves which resume version(s)?
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {versions.map((version) => {
                          const letter = version.letter;
                          const active = (p.serves_versions || []).includes(letter);
                          return (
                            <button
                              key={letter}
                              type="button"
                              onClick={() => toggleServesVersion(i, letter)}
                              className={`px-3 py-1.5 border text-[13px] font-serif italic transition-all ${
                                active
                                  ? 'border-ink bg-ink text-paper'
                                  : 'border-rule text-ink-2 hover:border-ink-2'
                              }`}
                              style={{ fontVariationSettings: '"opsz" 13, "SOFT" 50' }}
                            >
                              {letter} · {version?.label || ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-baseline justify-between pt-4">
                <p
                  className="font-serif italic text-[13px] text-ink-3"
                  style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
                >
                  {projects.length < 3
                    ? `${projects.length} of 3 minimum added.`
                    : `${projects.length} projects on the shelf.`}
                </p>
                <button type="button" onClick={addProject} className="btn-ghost">
                  + add a project
                </button>
              </div>
            </section>

            {/* Recognition */}
            <section>
              <div className="smallcaps text-[9px] text-ink-3 mb-3">Recognition</div>
              <p
                className="font-serif italic text-[14px] text-ink-2 mb-3 max-w-xl"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
              >
                Awards, talks, exhibitions, features, publications. Anything on the record.
              </p>
              <ChipPicker
                value={answers.recognition || []}
                onChange={(next) => update({ recognition: next })}
                placeholder="Add a recognition…"
              />
            </section>

            {/* Version tuning */}
            <section>
              <div className="smallcaps text-[9px] text-ink-3 mb-3">Resume versions</div>
              <p
                className="font-serif italic text-[14px] text-ink-2 mb-4 max-w-xl"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
              >
                Different roles call for different resumes. You might only need two, or you might
                need five. Rename them, adjust the emphasis, or remove any that don't fit.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {versions.map((v) => (
                  <div key={v.letter} className="p-5 border border-rule bg-paper-2/30 space-y-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-baseline gap-3 flex-1">
                        <span
                          className="font-serif text-[20px] text-stamp italic"
                          style={{ fontVariationSettings: '"opsz" 20, "SOFT" 60' }}
                        >
                          {v.letter}.
                        </span>
                        <input
                          type="text"
                          value={v.label}
                          onChange={(e) => updateVersion(v.letter, { label: e.target.value })}
                          placeholder="Version name"
                          className="field flex-1"
                        />
                      </div>
                      {versions.length > 1 && (
                        <ConfirmRemove label="remove" onConfirm={() => removeVersion(v.letter)} />
                      )}
                    </div>
                    <textarea
                      value={v.emphasis}
                      onChange={(e) => updateVersion(v.letter, { emphasis: e.target.value })}
                      rows={3}
                      placeholder="What kind of roles is this version for? What should it emphasize?"
                      className="field w-full font-serif text-[13px] leading-snug resize-y"
                      style={{ fontVariationSettings: '"opsz" 13, "SOFT" 30' }}
                    />
                  </div>
                ))}
              </div>
              {versions.length < 8 && (
                <div className="pt-4">
                  <button type="button" onClick={addVersion} className="btn-ghost">
                    + add a version
                  </button>
                </div>
              )}
            </section>
          </>
        );
      }}
    </ChapterShell>
  );
}
