'use client';

import { useState, useTransition } from 'react';
import { markApplicationSubmitted, unmarkApplicationSubmitted } from '@/actions/applications';

export function MarkSubmittedButton({
  roleId,
  isSubmitted,
  dateApplied,
}: {
  roleId: number;
  isSubmitted: boolean;
  dateApplied?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  // Track submitted/date locally so the button reflects success immediately.
  // The parent (materials page) loads its own status state once on mount and
  // doesn't refetch when this server action returns, so without local state
  // the button would flip back to "Mark as submitted" after the action.
  const [localSubmitted, setLocalSubmitted] = useState(isSubmitted);
  const [localDate, setLocalDate] = useState<string | null>(dateApplied ?? null);

  function handle(action: 'submit' | 'revert') {
    setError('');
    startTransition(async () => {
      const fd = new FormData();
      fd.set('role_id', String(roleId));
      const result = action === 'submit'
        ? await markApplicationSubmitted(fd)
        : await unmarkApplicationSubmitted(fd);
      if (result.success) {
        if (action === 'submit') {
          setLocalSubmitted(true);
          setLocalDate(new Date().toISOString().split('T')[0]);
        } else {
          setLocalSubmitted(false);
          setLocalDate(null);
        }
      } else {
        setError(result.error ?? 'Could not update.');
      }
    });
  }

  if (localSubmitted) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span
          className="font-serif italic text-[12px] text-ink-2"
          style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
        >
          Submitted{localDate ? ` on ${localDate}` : ''}
        </span>
        <button
          type="button"
          onClick={() => handle('revert')}
          disabled={isPending}
          className="font-serif italic text-[11px] text-ink-3 hover:text-stamp transition-colors disabled:opacity-50"
          style={{ fontVariationSettings: '"opsz" 11, "SOFT" 40' }}
        >
          {isPending ? 'Reverting…' : 'Mark as not submitted'}
        </button>
        {error && (
          <span className="font-serif italic text-[11px] text-stamp">{error}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => handle('submit')}
        disabled={isPending}
        className="btn-ghost disabled:opacity-50"
      >
        {isPending ? 'Marking…' : 'Mark as submitted'}
      </button>
      {error && (
        <span className="font-serif italic text-[11px] text-stamp">{error}</span>
      )}
    </div>
  );
}
