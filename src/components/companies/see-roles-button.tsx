'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  fetchCompanyPostings,
  scoreCompanyPostings,
  type CompanyPosting,
} from '@/actions/companies';
import { LoadingDots } from '@/components/layout/editorial';

interface Props {
  companyId: number;
  companyName: string;
}

/**
 * Only render this component when the company has ATS configured — caller's
 * responsibility (parent does the gating so React hooks rules stay clean).
 * No ATS means nothing to fetch live, so the button shouldn't appear.
 */
export function SeeRolesButton({ companyId, companyName }: Props) {
  const [open, setOpen] = useState(false);
  const [isFetching, startFetching] = useTransition();
  const [isScoring, startScoring] = useTransition();
  const [postings, setPostings] = useState<CompanyPosting[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [scoredCount, setScoredCount] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      setOpen(false);
      // Reset state for next open
      setPostings(null);
      setSelected(new Set());
      setError('');
      setScoredCount(null);
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, []);

  function handleOpen() {
    setOpen(true);
    setError('');
    setScoredCount(null);
    startFetching(async () => {
      const res = await fetchCompanyPostings(companyId);
      if (!res.ok || !res.postings) {
        setError(res.error ?? 'Failed to fetch postings.');
        setPostings([]);
        return;
      }
      setPostings(res.postings);
      // Pre-select the matched + not-already-scored ones for convenience.
      const initial = new Set(
        res.postings.filter((p) => p.matched && !p.alreadyScored).map((p) => p.index),
      );
      setSelected(initial);
    });
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) setOpen(false);
  }

  function toggle(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function selectAll() {
    if (!postings) return;
    setSelected(
      new Set(postings.filter((p) => !p.alreadyScored).map((p) => p.index)),
    );
  }
  function selectNone() {
    setSelected(new Set());
  }
  function selectMatched() {
    if (!postings) return;
    setSelected(
      new Set(
        postings.filter((p) => p.matched && !p.alreadyScored).map((p) => p.index),
      ),
    );
  }

  function handleScore() {
    if (!postings || selected.size === 0) return;
    setError('');
    startScoring(async () => {
      const res = await scoreCompanyPostings(companyId, [...selected], postings);
      if (!res.ok) {
        setError(res.error ?? 'Scoring failed.');
        return;
      }
      setScoredCount(res.scored ?? 0);
      router.refresh();
    });
  }

  const matchedCount = postings?.filter((p) => p.matched && !p.alreadyScored).length ?? 0;
  const scoreableCount = postings?.filter((p) => !p.alreadyScored).length ?? 0;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={isFetching}
        className="btn-stamp disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {isFetching ? 'Loading…' : 'See roles →'}
      </button>

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        className="bg-transparent backdrop:bg-ink/30 backdrop:backdrop-blur-[1px] p-0 max-w-2xl w-[calc(100%-2rem)] m-auto fixed inset-0"
      >
        <div className="bg-paper border border-ink shadow-[4px_4px_0_var(--ink)] p-7 space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="smallcaps text-[9px] text-ink-3 mb-2">Open roles</div>
              <h2
                className="font-serif text-[22px] leading-[1.1] text-ink tracking-[-0.01em]"
                style={{ fontVariationSettings: '"opsz" 36, "SOFT" 50' }}
              >
                {companyName}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-serif italic text-[13px] text-ink-3 hover:text-stamp transition-colors"
            >
              close ×
            </button>
          </div>

          {/* Loading */}
          {isFetching && (
            <div className="flex items-center gap-3 py-4">
              <LoadingDots />
              <span className="font-serif italic text-[13px] text-ink-2">
                Fetching from the ATS…
              </span>
            </div>
          )}

          {/* Error */}
          {error && !isFetching && (
            <p className="font-serif italic text-[13px] text-stamp">{error}</p>
          )}

          {/* Scored confirmation */}
          {scoredCount !== null && (
            <div className="border border-archive bg-archive/5 p-4">
              <p
                className="font-serif italic text-[14px] text-ink"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 50' }}
              >
                Scored {scoredCount} {scoredCount === 1 ? 'role' : 'roles'} at {companyName}.{' '}
                <Link
                  href={`/?company=${encodeURIComponent(companyName)}`}
                  className="text-stamp hover:underline"
                >
                  view in dashboard →
                </Link>
              </p>
            </div>
          )}

          {/* Picker */}
          {postings && postings.length > 0 && scoredCount === null && (
            <>
              <div className="flex items-baseline justify-between text-[10px] font-mono">
                <span className="text-ink-3">
                  {postings.length} open{' '}
                  {postings.length === 1 ? 'role' : 'roles'}
                  {matchedCount > 0 && (
                    <>
                      {' · '}
                      <span className="text-stamp">{matchedCount} match your compass</span>
                    </>
                  )}
                </span>
                <div className="flex gap-3">
                  {matchedCount > 0 && matchedCount < scoreableCount && (
                    <button
                      type="button"
                      onClick={selectMatched}
                      className="text-ink-2 hover:text-ink transition-colors"
                    >
                      matched
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-ink-2 hover:text-ink transition-colors"
                  >
                    all
                  </button>
                  <button
                    type="button"
                    onClick={selectNone}
                    className="text-ink-2 hover:text-ink transition-colors"
                  >
                    none
                  </button>
                </div>
              </div>

              <ul className="max-h-[340px] overflow-y-auto divide-y divide-rule-soft border border-rule">
                {postings.map((p) => (
                  <li key={p.index}>
                    <label
                      className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                        p.alreadyScored
                          ? 'opacity-60'
                          : selected.has(p.index)
                            ? 'bg-paper-2/60 cursor-pointer'
                            : 'hover:bg-paper-2/30 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(p.index)}
                        disabled={p.alreadyScored || isScoring}
                        onChange={() => toggle(p.index)}
                        className="accent-stamp mt-1 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span
                            className={`text-[14px] leading-snug ${
                              p.matched ? 'text-ink font-medium' : 'text-ink-2'
                            }`}
                          >
                            {p.title}
                          </span>
                          {p.matched && (
                            <span className="smallcaps text-[8px] text-stamp">match</span>
                          )}
                          {p.alreadyScored && (
                            <span className="smallcaps text-[8px] text-archive">scored</span>
                          )}
                        </div>
                        {(p.location || p.salary_range) && (
                          <div className="font-mono text-[10px] text-ink-3 mt-1">
                            {[p.location, p.salary_range].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                    </label>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-2">
                <Link
                  href={`/?company=${encodeURIComponent(companyName)}`}
                  className="font-serif italic text-[13px] text-ink-2 hover:text-stamp transition-colors"
                  style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
                >
                  view scored roles →
                </Link>
                <div className="flex items-center gap-3">
                  {isScoring && <LoadingDots />}
                  <button
                    type="button"
                    onClick={handleScore}
                    disabled={isScoring || selected.size === 0}
                    className="btn-stamp disabled:opacity-30"
                  >
                    {isScoring
                      ? 'Scoring…'
                      : `Score ${selected.size} ${selected.size === 1 ? 'role' : 'roles'} →`}
                  </button>
                </div>
              </div>
            </>
          )}

          {postings && postings.length === 0 && !isFetching && !error && (
            <p
              className="font-serif italic text-[14px] text-ink-2"
              style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
            >
              No open roles found at {companyName} right now.
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}
