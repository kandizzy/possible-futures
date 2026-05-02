'use client';

import { useState, useTransition } from 'react';
import {
  previewTrackPostings,
  type VerifiedSuggestion,
  type PostingPreviewItem,
} from '@/actions/discover';
import { PostingPicker } from './posting-picker';

export function SuggestionCard({
  suggestion,
  onTrack,
  onSkip,
}: {
  suggestion: VerifiedSuggestion;
  onTrack: (scored: number) => void;
  onSkip: () => Promise<void> | void;
}) {
  const [isPending, startTransition] = useTransition();
  const [postings, setPostings] = useState<PostingPreviewItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleTrack() {
    setError(null);
    startTransition(async () => {
      const res = await previewTrackPostings(suggestion.id);
      if (!res.ok) {
        setError(res.error ?? 'Failed to load postings');
        return;
      }
      if (!res.postings || res.postings.length === 0) {
        setError('No cached postings found. Re-verify first.');
        return;
      }
      setPostings(res.postings);
    });
  }

  function handleSkip() {
    startTransition(async () => {
      await onSkip();
    });
  }

  function handleDone(scored: number) {
    setPostings(null);
    onTrack(scored);
  }

  return (
    <article className="border border-rule bg-paper p-5 flex flex-col gap-4">
      {/* Head */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3
            className="font-serif text-[22px] leading-tight text-ink tracking-[-0.01em]"
            style={{ fontVariationSettings: '"opsz" 24, "SOFT" 50' }}
          >
            {suggestion.name}
          </h3>
          {suggestion.verified && (
            <span className="smallcaps text-[8px] text-archive whitespace-nowrap mt-1">
              verified
            </span>
          )}
        </div>
        {suggestion.category && (
          <div className="smallcaps text-[8px] text-ink-3 mt-1">{suggestion.category}</div>
        )}
      </div>

      {/* Why */}
      {suggestion.why_fits && (
        <p
          className="font-serif italic text-[13px] text-ink-2 leading-snug"
          style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
        >
          {suggestion.why_fits}
        </p>
      )}

      {/* Status line */}
      <div className="font-mono tabular text-[11px] text-ink-2">
        {suggestion.verified ? (
          <>
            <span className="text-ink">{suggestion.open_postings_count}</span> open{' '}
            {suggestion.open_postings_count === 1 ? 'role' : 'roles'}
            {suggestion.verified_provider && (
              <span className="text-ink-3">
                {' '}
                · {suggestion.verified_provider}/{suggestion.verified_slug}
              </span>
            )}
          </>
        ) : (
          <span className="text-stamp italic">ATS unknown — track manually</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="font-mono text-[11px] text-stamp">{error}</p>
      )}

      {/* Posting picker (expanded after Track click) */}
      {postings ? (
        <PostingPicker
          suggestionId={suggestion.id}
          companyName={suggestion.name}
          postings={postings}
          onDone={handleDone}
          onCancel={() => setPostings(null)}
        />
      ) : (
        /* Actions */
        <div className="flex items-center gap-3 pt-1">
          {suggestion.verified && (
            <button
              type="button"
              onClick={handleTrack}
              disabled={isPending}
              className="btn-stamp disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isPending ? 'Loading…' : 'See roles →'}
            </button>
          )}
          <button
            type="button"
            onClick={handleSkip}
            disabled={isPending}
            className="btn-link disabled:opacity-40"
          >
            skip
          </button>
          {suggestion.careers_url && (
            <a
              href={suggestion.careers_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-link ml-auto"
            >
              careers ↗
            </a>
          )}
        </div>
      )}
    </article>
  );
}
