'use client';

import { useState, useTransition } from 'react';
import { archiveRoleAction } from '@/actions/roles';
import { ConfirmModal } from '@/components/layout/confirm-modal';

export function ArchiveRoleButton({ roleId, label }: { roleId: number; label: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', String(roleId));
      await archiveRoleAction(formData);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost"
      >
        Archive role
      </button>
      <ConfirmModal
        open={open}
        onCancel={() => {
          if (!isPending) setOpen(false);
        }}
        onConfirm={handleArchive}
        title={`Archive ${label}?`}
        body={
          <>
            Archiving keeps the role and everything attached to it — notes, calibrations,
            application status, and generated materials — but removes it from your active
            dashboard. You can find it later under Archive, and restore it if anything
            changes.
          </>
        }
        confirmLabel="Archive role"
        isPending={isPending}
      />
    </>
  );
}
