'use client';

import { useState, useTransition } from 'react';
import { acknowledgeRitual } from '@/actions/ritual';

const CHECKLIST = [
  'I have 30 minutes and a quiet space.',
  'My last three roles are in front of me.',
  "I'm writing this myself, not generating it.",
] as const;

export function BeginRitual() {
  const [checked, setChecked] = useState<boolean[]>(() => CHECKLIST.map(() => false));
  const [isPending, startTransition] = useTransition();

  const allChecked = checked.every(Boolean);

  function toggle(index: number) {
    setChecked((prev) => prev.map((c, i) => (i === index ? !c : c)));
  }

  function handleBegin() {
    if (!allChecked || isPending) return;
    startTransition(async () => {
      await acknowledgeRitual();
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 md:px-12">
      {/* Frontispiece */}
      <div className="smallcaps text-[9px] text-ink-3 mb-6">A word before you begin</div>

      <h1
        className="font-serif text-[38px] sm:text-[48px] md:text-[60px] leading-[0.92] text-ink tracking-[-0.02em] mb-10 md:mb-12"
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
      >
        The compass <br />
        <span
          className="italic text-stamp"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}
        >
          is the foundation.
        </span>
      </h1>

      {/* Body — all Fraunces, generous line height, notebook feel */}
      <div className="font-serif text-[16px] md:text-[18px] text-ink leading-[1.65] space-y-5 max-w-xl">
        <p>
          This is going to take thirty to forty-five minutes if you do it right. Find a quiet
          room. Close your other tabs.
        </p>
        <p>
          Have the last three roles you worked in front of you — titles, dates, what you built,
          what you wish you had built differently. A resume PDF is fine; an open text file works
          too.
        </p>
        <p
          className="italic text-ink-2"
          style={{ fontVariationSettings: '"opsz" 18, "SOFT" 60' }}
        >
          This is the one place in the app where you should not use AI. Everything
          downstream — the company suggestions, the scoring, the tailored cover letters — runs
          on the voice you write here. If this document sounds like ChatGPT, the whole system
          talks to you in a voice that isn&rsquo;t yours. You&rsquo;ll end up applying to roles
          that don&rsquo;t fit, in words that aren&rsquo;t yours.
        </p>
        <p>
          The compass is the foundation. Write it in your own words or don&rsquo;t write it
          at all.
        </p>
        <p
          className="text-ink-3 italic text-[14px] md:text-[15px]"
          style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
        >
          We don&rsquo;t import resumes or LinkedIn profiles here on purpose. The foundation
          has to be you, writing.
        </p>
      </div>

      {/* Checklist */}
      <div className="mt-12 md:mt-16 pt-8 md:pt-10 border-t border-rule">
        <div className="smallcaps text-[9px] text-ink-3 mb-5">Before you continue</div>
        <ul className="space-y-4 max-w-xl">
          {CHECKLIST.map((line, i) => (
            <li key={i}>
              <label className="flex items-start gap-4 cursor-pointer group">
                <span
                  className={`mt-[3px] shrink-0 h-5 w-5 border ${
                    checked[i]
                      ? 'border-ink bg-ink'
                      : 'border-ink-2 bg-transparent group-hover:border-ink'
                  } transition-colors relative`}
                  aria-hidden
                >
                  {checked[i] && (
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      className="absolute inset-0 text-paper"
                    >
                      <path
                        d="M4 10l4 4 8-8"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span
                  className="font-serif italic text-[15px] md:text-[16px] text-ink-2 leading-snug"
                  style={{ fontVariationSettings: '"opsz" 16, "SOFT" 50' }}
                >
                  {line}
                </span>
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() => toggle(i)}
                  className="sr-only"
                />
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <button
            type="button"
            onClick={handleBegin}
            disabled={!allChecked || isPending}
            className="btn-stamp disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-stamp disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0_var(--ink)]"
          >
            {isPending ? 'Beginning…' : 'Begin the intake →'}
          </button>
          {!allChecked && (
            <p
              className="mt-4 font-serif italic text-[12px] text-ink-3"
              style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
            >
              Tick all three to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
