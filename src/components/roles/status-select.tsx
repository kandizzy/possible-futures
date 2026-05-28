'use client';

import { useState, useTransition } from 'react';
import { updateStatus } from '@/actions/calibrate';
import { getStatusStyle } from '@/lib/types';
import type { RoleStatus } from '@/lib/types';
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

export function StatusSelect({
  roleId,
  currentStatus,
}: {
  roleId: number;
  currentStatus: RoleStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  // The status the user just picked, awaiting commit. Picking a status never
  // blocks and never warns — it just opens an invitation to note the change.
  // You either Save a note (recorded on the timeline) or Skip (the change
  // still happens, it just doesn't land in history).
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
    setNote('');
    setPending(status);
  }

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
        <div className="border-l-2 border-rule pl-3 py-1">
          <div className="smallcaps text-[9px] text-ink-3 mb-1.5">
            {currentStatus.toLowerCase()} → {pending.toLowerCase()}
          </div>
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
          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              onClick={() => commit(pending, note)}
              disabled={isPending || !note.trim()}
              className="btn-stamp text-[12px] disabled:opacity-40"
            >
              {isPending ? 'Saving' : 'Save note'}
            </button>
            <button
              type="button"
              onClick={() => commit(pending)}
              disabled={isPending}
              className="btn-link text-[12px]"
            >
              skip
            </button>
            <button
              type="button"
              onClick={() => {
                setPending(null);
                setNote('');
              }}
              disabled={isPending}
              className="btn-link text-[12px] text-ink-3 ml-auto"
            >
              cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
