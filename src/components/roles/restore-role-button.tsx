'use client';

import { useState, useTransition } from 'react';
import { unarchiveRoleAction } from '@/actions/roles';

export function RestoreRoleButton({ roleId }: { roleId: number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleRestore() {
    setError('');
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(roleId));
      const result = await unarchiveRoleAction(formData);
      if (!result.ok) {
        setError(result.error ?? 'Could not restore.');
      }
    });
  }

  return (
    <div className="flex flex-wrap items-baseline gap-3">
      <button
        type="button"
        onClick={handleRestore}
        disabled={isPending}
        className="btn-ghost disabled:opacity-50"
      >
        {isPending ? 'Restoring…' : 'Restore role'}
      </button>
      {error && (
        <span
          className="font-serif italic text-[13px] text-stamp"
          style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
