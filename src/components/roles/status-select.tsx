'use client';

import { useState, useTransition } from 'react';
import { updateStatus } from '@/actions/calibrate';
import { getStatusStyle } from '@/lib/types';
import type { RoleStatus } from '@/lib/types';
import { isUnusualTransition, unusualTransitionReason } from '@/lib/status-order';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/layout/select';

const STATUSES: RoleStatus[] = [
  'New',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
  'Ghosted',
  'Withdrawn',
  'Skipped',
];

// Role statuses that land on the application journey — these map to an
// application status, create a timeline event, and (when withNote is on)
// offer an optional note. New / Ghosted / Skipped change status silently.
const NOTABLE = new Set<RoleStatus>([
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
  'Withdrawn',
]);

export function StatusSelect({
  roleId,
  currentStatus,
  withNote = false,
}: {
  roleId: number;
  currentStatus: RoleStatus;
  // When true, picking an interview-space status reveals an optional note
  // field before committing. Off by default so compact surfaces (dashboard
  // rows) stay a quick flip.
  withNote?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [pending, setPending] = useState<RoleStatus | null>(null);
  const [note, setNote] = useState('');

  function commit(status: RoleStatus, noteText?: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('role_id', String(roleId));
      formData.set('status', status);
      if (noteText && noteText.trim()) formData.set('note', noteText.trim());
      await updateStatus(formData);
      setPending(null);
      setNote('');
      router.refresh();
    });
  }

  function handlePick(value: string) {
    const status = value as RoleStatus;
    if (status === currentStatus) return;
    const wantsNote = withNote && NOTABLE.has(status);
    const unusual = isUnusualTransition(currentStatus, status);
    // Open the panel to collect a note, to confirm an unusual move, or both.
    // A plain, sensible change with no note to give just commits.
    if (wantsNote || unusual) {
      setNote('');
      setPending(status);
    } else {
      commit(status);
    }
  }

  const unusual = pending ? isUnusualTransition(currentStatus, pending) : false;
  const showNote = pending ? withNote && NOTABLE.has(pending) : false;

  return (
    <div className="flex flex-col gap-2">
      <Select
        variant="inline"
        value={currentStatus}
        onChange={handlePick}
        disabled={isPending}
        aria-label="Role status"
        className={`font-serif text-[14px] hover:text-stamp transition-colors ${getStatusStyle(currentStatus)}`}
        style={{ fontVariationSettings: '"opsz" 14, "SOFT" 50' }}
        options={STATUSES.map((s) => ({ value: s, label: s.toLowerCase() }))}
      />

      {pending && (
        <div
          className={`border-l-2 pl-3 py-1 ${unusual ? 'border-stamp' : 'border-rule'}`}
        >
          <div className="smallcaps text-[9px] text-ink-3 mb-1.5">
            {currentStatus.toLowerCase()} → {pending.toLowerCase()}
          </div>
          {unusual && (
            <p
              className="mb-2 font-serif italic text-[12px] text-stamp leading-snug"
              style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
            >
              {unusualTransitionReason(currentStatus, pending)} Confirm to continue.
            </p>
          )}
          {showNote && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for this change — optional"
              rows={3}
              autoFocus
              disabled={isPending}
              className="field w-full font-serif text-[13px] leading-[1.6] resize-y"
              style={{ fontVariationSettings: '"opsz" 13, "SOFT" 30' }}
            />
          )}
          <div className={`flex items-center gap-4 ${showNote ? 'mt-2' : ''}`}>
            <button
              type="button"
              onClick={() => commit(pending, showNote ? note : undefined)}
              disabled={isPending}
              className="btn-stamp text-[12px]"
            >
              {isPending ? 'Saving' : unusual && !showNote ? 'Confirm change' : 'Save change'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPending(null);
                setNote('');
              }}
              disabled={isPending}
              className="btn-link text-[12px]"
            >
              cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
