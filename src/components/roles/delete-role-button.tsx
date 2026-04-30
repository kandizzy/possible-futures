'use client';

import { useState, useTransition } from 'react';
import { deleteRoleAction } from '@/actions/roles';

export function DeleteRoleButton({ roleId, label }: { roleId: number; label: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(roleId));
      await deleteRoleAction(formData);
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="font-serif italic text-[13px] text-ink-3 hover:text-stamp transition-colors"
        style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
      >
        Delete this role
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span
        className="font-serif italic text-[13px] text-ink-2"
        style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
      >
        Delete <span className="not-italic font-serif text-ink">{label}</span>? This removes the role and all related notes, calibrations, applications, and materials.
      </span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="font-serif italic text-[13px] text-stamp hover:text-stamp-deep transition-colors disabled:opacity-50"
        style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
      >
        {isPending ? 'Deleting…' : 'Yes, delete'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="font-serif italic text-[13px] text-ink-3 hover:text-ink transition-colors disabled:opacity-50"
        style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
      >
        Cancel
      </button>
    </div>
  );
}
