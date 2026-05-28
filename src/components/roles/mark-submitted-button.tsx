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
  // Submitting opens a note panel first — it's an interview-space change, so
  // it can carry a journey note. Reverting is a correction and stays a click.
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');

  function submit() {
    setError('');
    startTransition(async () => {
      const fd = new FormData();
      fd.set('role_id', String(roleId));
      if (note.trim()) fd.set('note', note.trim());
      const result = await markApplicationSubmitted(fd);
      if (result.success) {
        setLocalSubmitted(true);
        setLocalDate(new Date().toISOString().split('T')[0]);
        setNoteOpen(false);
        setNote('');
      } else {
        setError(result.error ?? 'Could not update.');
      }
    });
  }

  function revert() {
    setError('');
    startTransition(async () => {
      const fd = new FormData();
      fd.set('role_id', String(roleId));
      const result = await unmarkApplicationSubmitted(fd);
      if (result.success) {
        setLocalSubmitted(false);
        setLocalDate(null);
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
          onClick={revert}
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

  if (noteOpen) {
    return (
      <div className="flex flex-col gap-2 w-full max-w-sm">
        <div className="smallcaps text-[9px] text-ink-3">Marking as submitted</div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note this change for your journey — or skip it"
          rows={3}
          autoFocus
          disabled={isPending}
          className="field w-full font-serif text-[13px] leading-[1.6] resize-y"
          style={{ fontVariationSettings: '"opsz" 13, "SOFT" 30' }}
        />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="btn-stamp text-[12px]"
          >
            {isPending ? 'Marking…' : 'Mark as submitted'}
          </button>
          <button
            type="button"
            onClick={() => {
              setNoteOpen(false);
              setNote('');
            }}
            disabled={isPending}
            className="btn-link text-[12px]"
          >
            cancel
          </button>
        </div>
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
        onClick={() => setNoteOpen(true)}
        disabled={isPending}
        className="btn-ghost disabled:opacity-50"
      >
        Mark as submitted
      </button>
      {error && (
        <span className="font-serif italic text-[11px] text-stamp">{error}</span>
      )}
    </div>
  );
}
