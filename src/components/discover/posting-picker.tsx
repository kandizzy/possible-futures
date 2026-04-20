'use client';

import { useState, useTransition } from 'react';
import {
  confirmTrackCompany,
  type PostingPreviewItem,
} from '@/actions/discover';

export function PostingPicker({
  suggestionId,
  companyName,
  postings,
  onDone,
  onCancel,
}: {
  suggestionId: number;
  companyName: string;
  postings: PostingPreviewItem[];
  onDone: (scored: number) => void;
  onCancel: () => void;
}) {
  const matchedIds = new Set(postings.filter((p) => p.matched).map((p) => p.cache_id));
  const [selected, setSelected] = useState<Set<number>>(matchedIds);
  const [isScoring, startScoring] = useTransition();
  const [progress, setProgress] = useState<string | null>(null);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(postings.map((p) => p.cache_id)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  function selectMatched() {
    setSelected(new Set(matchedIds));
  }

  function handleConfirm() {
    if (selected.size === 0) return;
    setProgress(`Scoring 0 of ${selected.size}…`);
    startScoring(async () => {
      const res = await confirmTrackCompany(suggestionId, [...selected]);
      if (res.ok) {
        onDone(res.postings_scored ?? 0);
      } else {
        setProgress(res.error ?? 'Scoring failed');
      }
    });
  }

  const matchedCount = postings.filter((p) => p.matched).length;

  return (
    <div className="border-t border-rule mt-4 pt-4 space-y-4">
      <div className="flex items-baseline justify-between">
        <div className="smallcaps text-[9px] text-ink-3">
          {postings.length} open roles at {companyName}
        </div>
        <div className="flex gap-3">
          {matchedCount > 0 && matchedCount < postings.length && (
            <button
              type="button"
              onClick={selectMatched}
              className="font-mono text-[10px] text-ink-2 hover:text-ink transition-colors"
            >
              matched ({matchedCount})
            </button>
          )}
          <button
            type="button"
            onClick={selectAll}
            className="font-mono text-[10px] text-ink-2 hover:text-ink transition-colors"
          >
            all
          </button>
          <button
            type="button"
            onClick={selectNone}
            className="font-mono text-[10px] text-ink-2 hover:text-ink transition-colors"
          >
            none
          </button>
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto space-y-1">
        {postings.map((p) => (
          <label
            key={p.cache_id}
            className={`flex items-start gap-3 px-3 py-2 cursor-pointer transition-colors ${
              selected.has(p.cache_id)
                ? 'bg-paper-2/60'
                : 'hover:bg-paper-2/30'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(p.cache_id)}
              onChange={() => toggle(p.cache_id)}
              disabled={isScoring}
              className="accent-stamp mt-1 shrink-0"
            />
            <div className="min-w-0">
              <div
                className={`text-[13px] leading-snug ${
                  p.matched ? 'text-ink font-medium' : 'text-ink-2'
                }`}
              >
                {p.title}
                {p.matched && (
                  <span className="ml-2 smallcaps text-[8px] text-stamp">match</span>
                )}
              </div>
              {p.location && (
                <div className="font-mono text-[10px] text-ink-3 mt-0.5">{p.location}</div>
              )}
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isScoring}
          className="btn-link disabled:opacity-40"
        >
          cancel
        </button>
        <div className="flex items-center gap-4">
          {isScoring && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1" aria-hidden>
                <span className="h-1.5 w-1.5 rounded-full bg-stamp animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-stamp animate-pulse" style={{ animationDelay: '300ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-stamp animate-pulse" style={{ animationDelay: '600ms' }} />
              </div>
              {progress && (
                <span className="font-mono tabular text-[11px] text-ink-3">{progress}</span>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isScoring || selected.size === 0}
            className="btn-stamp disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isScoring
              ? 'Scoring…'
              : `Score ${selected.size} role${selected.size === 1 ? '' : 's'} →`}
          </button>
        </div>
      </div>
    </div>
  );
}
