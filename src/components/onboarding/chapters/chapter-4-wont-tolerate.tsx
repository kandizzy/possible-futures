'use client';

import { ChapterShell } from '../chapter-shell';
import { ChipPicker } from '../chip-picker';
import { HighlightSelect } from '../highlight-select';
import {
  SUGGESTED_RED_FLAG_WORDS,
  SUGGESTED_BANNED_WORDS,
  VOICE_SAMPLE_PARAGRAPH,
  HIGHLIGHT_PHRASE_CANDIDATES,
} from '@/lib/onboarding/defaults';
import type { IntakeAnswers, IntakeChapter } from '@/lib/types';

export function Chapter4WontTolerate({
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
        if (!a.red_flag_words || a.red_flag_words.length < 3)
          return 'Pick at least three red flag words. The suggestions will do in a pinch.';
        return null;
      }}
    >
      {({ answers, update }) => {
        const voiceSamples = answers.voice_samples || [];

        function toggleVoice(phrase: string) {
          if (voiceSamples.includes(phrase)) {
            update({ voice_samples: voiceSamples.filter((v) => v !== phrase) });
          } else {
            update({ voice_samples: [...voiceSamples, phrase] });
          }
        }

        return (
          <>
            {/* Red flag words */}
            <section>
              <div className="smallcaps text-[9px] text-ink-3 mb-3">Red flags in postings</div>
              <p
                className="font-serif italic text-[14px] text-ink-2 mb-3 max-w-xl"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
              >
                Words that mean &ldquo;think twice&rdquo; when they show up in a job posting.
                Scores drop when these appear.
              </p>
              <ChipPicker
                value={answers.red_flag_words || []}
                onChange={(next) => update({ red_flag_words: next })}
                placeholder="Type a red flag…"
                suggestions={SUGGESTED_RED_FLAG_WORDS}
                accent="stamp"
                quoted
              />
            </section>

            {/* Banned words */}
            <section>
              <div className="smallcaps text-[9px] text-ink-3 mb-3">Words to never use</div>
              <p
                className="font-serif italic text-[14px] text-ink-2 mb-3 max-w-xl"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
              >
                When the app generates cover letters or resume summaries, these words are
                off-limits. Start with the usual suspects.
              </p>
              <ChipPicker
                value={answers.banned_words || []}
                onChange={(next) => update({ banned_words: next })}
                placeholder="Type a word to ban…"
                suggestions={SUGGESTED_BANNED_WORDS}
                quoted
              />
            </section>

            {/* Voice sample highlight game */}
            <section>
              <div className="smallcaps text-[9px] text-ink-3 mb-3">Your voice</div>
              <p
                className="font-serif italic text-[14px] text-ink-2 mb-4 max-w-xl"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
              >
                Click phrases that sound like something you would actually say. If none of
                this sounds like you, paste in something that does.
              </p>
              <div className="p-6 border border-rule bg-paper-2/30">
                <HighlightSelect
                  paragraph={VOICE_SAMPLE_PARAGRAPH}
                  phrases={HIGHLIGHT_PHRASE_CANDIDATES}
                  selected={voiceSamples}
                  onToggle={toggleVoice}
                />
              </div>
              <textarea
                value={answers.custom_voice_sample || ''}
                onChange={(e) => update({ custom_voice_sample: e.target.value })}
                rows={3}
                placeholder="Paste a paragraph from your own writing that sounds like you. A cover letter, an email, a blog post."
                className="mt-3 field w-full font-serif text-[14px] leading-snug resize-y"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 30' }}
              />
            </section>

            {/* Sensitive context */}
            <section>
              <div className="smallcaps text-[9px] text-ink-3 mb-3">Sensitive context (private)</div>
              <p
                className="font-serif italic text-[14px] text-ink-2 mb-3 max-w-xl"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
              >
                Anything that affects how your story should be told? Career gaps, overlaps, a
                reason you left somewhere, a title that doesn't translate. This stays private to
                the app — the AI uses it to frame your materials, never copies it verbatim.
              </p>
              <textarea
                value={answers.sensitive_context || ''}
                onChange={(e) => update({ sensitive_context: e.target.value })}
                rows={4}
                placeholder="Career restart after burnout. Took a year off. Don't mention this directly in any materials, but use it to explain the 2023 gap."
                className="field w-full font-serif text-[14px] leading-snug resize-y"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 30' }}
              />
            </section>
          </>
        );
      }}
    </ChapterShell>
  );
}
