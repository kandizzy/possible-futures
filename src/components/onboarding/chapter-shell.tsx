'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type ReactNode } from 'react';
import { saveIntakeProgress } from '@/actions/onboarding';
import type { IntakeAnswers, IntakeChapter } from '@/lib/types';

const CHAPTERS: { numeral: string; title: string; tail?: string; subtitle: string }[] = [
  {
    numeral: 'I',
    title: 'The',
    tail: 'Setup.',
    subtitle:
      'Who you are, in the briefest possible sketch. Name, contact, the thread that runs through your work.',
  },
  {
    numeral: 'II',
    title: 'The',
    tail: 'Throughline.',
    subtitle:
      'Three or more roles, told your way. Dump the messy notes — we can tidy them later.',
  },
  {
    numeral: 'III',
    title: 'What You\'re',
    tail: 'Looking For.',
    subtitle:
      'The shape of the thing you want next. Signals, tiers, companies, a compensation floor.',
  },
  {
    numeral: 'IV',
    title: 'The',
    tail: 'Playbook.',
    subtitle:
      'Your guardrails. Red flags that lower a score, words you refuse to use, your voice, and context that shapes how your story gets told. This grows sharper as you use the app.',
  },
  {
    numeral: 'V',
    title: 'The',
    tail: 'Shelf of Proof.',
    subtitle:
      'Projects you\'re proud of, the recognition you\'ve earned, and which resume version each one serves.',
  },
];

interface Props {
  chapter: IntakeChapter;
  initialAnswers: IntakeAnswers;
  children: (props: {
    answers: IntakeAnswers;
    update: (patch: Partial<IntakeAnswers>) => void;
    error: string;
    setError: (v: string) => void;
  }) => ReactNode;
  /**
   * Optional guard: return an error string to block advancing. Called on "next".
   */
  canAdvance?: (answers: IntakeAnswers) => string | null;
  nextLabel?: string;
  nextHref?: string;
}

export function ChapterShell({
  chapter,
  initialAnswers,
  children,
  canAdvance,
  nextLabel,
  nextHref,
}: Props) {
  const [answers, setAnswers] = useState<IntakeAnswers>(initialAnswers);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const meta = CHAPTERS[chapter - 1];

  function update(patch: Partial<IntakeAnswers>) {
    setAnswers((prev) => ({ ...prev, ...patch }));
    setError('');
  }

  async function save(next: IntakeChapter) {
    const formData = new FormData();
    formData.set('chapter', String(next));
    formData.set('answers', JSON.stringify(answers));
    const res = await saveIntakeProgress(formData);
    if (!res.success) {
      setError(res.error);
      return false;
    }
    return true;
  }

  function goNext() {
    if (canAdvance) {
      const problem = canAdvance(answers);
      if (problem) {
        setError(problem);
        return;
      }
    }
    startTransition(async () => {
      const nextChapter = (chapter + 1) as IntakeChapter;
      if (await save(nextChapter > 5 ? 5 : nextChapter)) {
        if (nextHref) {
          router.push(nextHref);
        } else if (chapter === 5) {
          router.push('/onboarding/publish');
        } else {
          router.push(`/onboarding/${chapter + 1}`);
        }
      }
    });
  }

  function goBack() {
    if (chapter === 1) return;
    startTransition(async () => {
      await save((chapter - 1) as IntakeChapter);
      router.push(`/onboarding/${chapter - 1}`);
    });
  }

  return (
    <div className="space-y-10 md:space-y-14 pb-16">
      {/* Eyebrow */}
      <div className="flex items-baseline justify-between">
        <div className="smallcaps text-[10px] text-ink-3">
          Chapter {meta.numeral} of V · First Printing
        </div>
        <Link
          href="/"
          className="font-serif italic text-[12px] text-ink-3 hover:text-stamp transition-colors"
          style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
        >
          save and exit →
        </Link>
      </div>

      {/* Quiet reminder on every chapter — you, writing. */}
      <div
        className="font-serif italic text-[12px] text-ink-3 leading-snug"
        style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
      >
        You, writing. Not Claude.
      </div>

      {/* Title */}
      <header className="rise">
        <h1
          className="font-serif text-[42px] sm:text-[52px] md:text-[64px] leading-[0.88] text-ink tracking-[-0.025em]"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
        >
          {meta.title}
          <br />
          <span
            className="italic text-stamp"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}
          >
            {meta.tail}
          </span>
        </h1>
        <p
          className="mt-4 md:mt-5 font-serif text-[15px] md:text-[17px] text-ink-2 leading-snug max-w-xl italic"
          style={{ fontVariationSettings: '"opsz" 18, "SOFT" 40' }}
        >
          {meta.subtitle}
        </p>
      </header>

      {/* Content */}
      <div className="rise space-y-10" style={{ animationDelay: '80ms' }}>
        {children({ answers, update, error, setError })}
      </div>

      {/* Error */}
      {error && (
        <div
          className="font-serif italic text-[14px] text-stamp border-l-2 border-stamp pl-4"
          style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
        >
          {error}
        </div>
      )}

      {/* Nav footer */}
      <div className="flex items-center justify-between pt-8 border-t border-rule">
        <button
          type="button"
          onClick={goBack}
          disabled={chapter === 1 || isPending}
          className="btn-link disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← back
        </button>

        <ProgressPips current={chapter} />

        <button
          type="button"
          onClick={goNext}
          disabled={isPending}
          className="btn-stamp disabled:opacity-50"
        >
          {isPending
            ? '…'
            : nextLabel || (chapter === 5 ? 'Ready to publish →' : 'next chapter →')}
        </button>
      </div>
    </div>
  );
}

function ProgressPips({ current }: { current: IntakeChapter }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Chapter ${current} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`block h-[3px] w-6 rounded-full transition-all ${
            n < current ? 'bg-ink' : n === current ? 'bg-stamp w-10' : 'bg-rule'
          }`}
        />
      ))}
    </div>
  );
}
