'use client';

import { ChapterShell } from '../chapter-shell';
import { ChipPicker } from '../chip-picker';
import {
  SUGGESTED_SIGNAL_WORDS,
  SUGGESTED_COMPANIES_BY_CATEGORY,
  SUGGESTED_ROLE_TIERS,
} from '@/lib/onboarding/defaults';
import type { IntakeAnswers, IntakeChapter, IntakeRoleTiers } from '@/lib/types';

export function Chapter3LookingFor({
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
        if (!a.dream_role?.trim())
          return 'One sentence for the dream role, then you can move on.';
        if (!a.signal_words || a.signal_words.length < 3)
          return 'Three signal words is the minimum. Pick a few from the suggestions if none come to mind.';
        return null;
      }}
    >
      {({ answers, update }) => {
        const tiers: IntakeRoleTiers = answers.role_tiers || {
          dream: [],
          strong: [],
          acceptable: [],
        };
        const allCompanySuggestions = Object.values(SUGGESTED_COMPANIES_BY_CATEGORY).flat();

        return (
          <>
            {/* Dream role */}
            <section>
              <div className="smallcaps text-[9px] text-ink-3 mb-3">The dream role</div>
              <p
                className="font-serif italic text-[14px] text-ink-2 mb-3 max-w-xl"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
              >
                If you could describe the job you want in one sentence, what would it say?
              </p>
              <textarea
                value={answers.dream_role || ''}
                onChange={(e) => update({ dream_role: e.target.value })}
                rows={2}
                placeholder="Staff Design Engineer at a small team that ships things that feel like instruments."
                className="field w-full font-serif text-[16px] leading-snug resize-y"
                style={{ fontVariationSettings: '"opsz" 16, "SOFT" 30' }}
              />
            </section>

            {/* Role tiers */}
            <section>
              <div className="smallcaps text-[9px] text-ink-3 mb-3">Role tiers</div>
              <p
                className="font-serif italic text-[14px] text-ink-2 mb-4 max-w-xl"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
              >
                Three tiers of role titles that would make you open the posting. Dream goes
                first, then strong fits, then acceptable fallbacks.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TierColumn
                  label="Dream"
                  values={tiers.dream}
                  suggestions={SUGGESTED_ROLE_TIERS.dream}
                  accent="stamp"
                  onChange={(next) => update({ role_tiers: { ...tiers, dream: next } })}
                />
                <TierColumn
                  label="Strong fit"
                  values={tiers.strong}
                  suggestions={SUGGESTED_ROLE_TIERS.strong}
                  onChange={(next) => update({ role_tiers: { ...tiers, strong: next } })}
                />
                <TierColumn
                  label="Acceptable"
                  values={tiers.acceptable}
                  suggestions={SUGGESTED_ROLE_TIERS.acceptable}
                  onChange={(next) => update({ role_tiers: { ...tiers, acceptable: next } })}
                />
              </div>
            </section>

            {/* Target companies */}
            <section>
              <div className="smallcaps text-[9px] text-ink-3 mb-3">Target companies</div>
              <p
                className="font-serif italic text-[14px] text-ink-2 mb-3 max-w-xl"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
              >
                The houses you'd open a cold email for. You can add your own and browse a
                starter list.
              </p>
              <ChipPicker
                value={answers.target_companies || []}
                onChange={(next) => update({ target_companies: next })}
                placeholder="Type a company name…"
                suggestions={allCompanySuggestions}
              />
            </section>

            {/* Signal words */}
            <section>
              <div className="smallcaps text-[9px] text-ink-3 mb-3">Signal words</div>
              <p
                className="font-serif italic text-[14px] text-ink-2 mb-3 max-w-xl"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
              >
                Words and phrases that mean &ldquo;pay attention&rdquo; when they show up in a
                job posting. Postings score higher when Possible Futures finds these in the text.
              </p>
              <ChipPicker
                value={answers.signal_words || []}
                onChange={(next) => update({ signal_words: next })}
                placeholder="Type a signal word…"
                suggestions={SUGGESTED_SIGNAL_WORDS}
                quoted
              />
            </section>

            {/* Compensation floor */}
            <section>
              <div className="smallcaps text-[9px] text-ink-3 mb-3">Compensation floor</div>
              <p
                className="font-serif italic text-[14px] text-ink-2 mb-3 max-w-xl"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
              >
                Below this number, the Compass marks Pay as a weak score and flags it. Pick
                your honest floor, not your aspiration.
              </p>
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-[20px] text-ink-2">$</span>
                <input
                  type="number"
                  value={answers.compensation_floor ?? ''}
                  onChange={(e) =>
                    update({
                      compensation_floor: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  min={0}
                  step={5000}
                  placeholder="150000"
                  className="field w-48 font-mono tabular"
                />
              </div>
            </section>

            {/* Location / remote */}
            <section>
              <div className="smallcaps text-[9px] text-ink-3 mb-3">Location</div>
              <div className="space-y-3 max-w-xl">
                <input
                  type="text"
                  value={answers.location_constraint || ''}
                  onChange={(e) => update({ location_constraint: e.target.value })}
                  placeholder="NYC, remote US, or specific cities"
                  className="field w-full"
                />
                <label className="flex items-baseline gap-3">
                  <input
                    type="checkbox"
                    checked={answers.remote_ok ?? false}
                    onChange={(e) => update({ remote_ok: e.target.checked })}
                    className="accent-stamp"
                  />
                  <span
                    className="font-serif italic text-[14px] text-ink-2"
                    style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
                  >
                    Remote work is fine with me.
                  </span>
                </label>
              </div>
            </section>
          </>
        );
      }}
    </ChapterShell>
  );
}

function TierColumn({
  label,
  values,
  suggestions,
  onChange,
  accent = 'ink',
}: {
  label: string;
  values: string[];
  suggestions: string[];
  onChange: (next: string[]) => void;
  accent?: 'ink' | 'stamp';
}) {
  return (
    <div className="border-t border-rule pt-4">
      <div className="smallcaps text-[9px] text-ink-3 mb-3">{label}</div>
      <ChipPicker
        value={values}
        onChange={onChange}
        placeholder="+ add title"
        suggestions={suggestions}
        accent={accent}
      />
    </div>
  );
}
