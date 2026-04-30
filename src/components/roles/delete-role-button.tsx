'use client';

import { useState, useTransition } from 'react';
import { deleteRoleAction } from '@/actions/roles';
import { ConfirmModal } from '@/components/layout/confirm-modal';

export function DeleteRoleButton({ roleId, label }: { roleId: number; label: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(roleId));
      await deleteRoleAction(formData);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-serif italic text-[13px] text-ink-3 hover:text-stamp transition-colors"
        style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
      >
        Delete this role
      </button>
      <ConfirmModal
        open={open}
        onCancel={() => {
          if (!isPending) setOpen(false);
        }}
        onConfirm={handleDelete}
        title={`Delete ${label}?`}
        body={
          <>
            This permanently removes the role and everything attached to it —
            notes, calibrations, application status, and generated materials.
            This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete role"
        isPending={isPending}
        destructive
      />
    </>
  );
}
