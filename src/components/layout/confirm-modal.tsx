'use client';

import { useEffect, useRef } from 'react';

export function ConfirmModal({
  open,
  onCancel,
  onConfirm,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isPending = false,
  destructive = false,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  destructive?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Cancel via ESC or backdrop close fires the dialog's "cancel"/"close" events
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => onCancel();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onCancel]);

  // Backdrop click — clicks land on the dialog element itself when outside content
  function handleClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === ref.current) onCancel();
  }

  return (
    <dialog
      ref={ref}
      onClick={handleClick}
      className="bg-transparent backdrop:bg-ink/30 backdrop:backdrop-blur-[1px] p-0 max-w-lg w-[calc(100%-2rem)] m-auto fixed inset-0"
    >
      <div className="bg-paper border border-ink shadow-[4px_4px_0_var(--ink)] p-8">
        <div className="smallcaps text-[9px] text-ink-3 mb-4">
          {destructive ? 'Confirm deletion' : 'Confirm'}
        </div>
        <h2
          className="font-serif text-[26px] leading-[1.1] text-ink tracking-[-0.01em] mb-4"
          style={{ fontVariationSettings: '"opsz" 36, "SOFT" 50' }}
        >
          {title}
        </h2>
        <div
          className="font-serif text-[15px] leading-[1.55] text-ink-2 mb-8"
          style={{ fontVariationSettings: '"opsz" 15, "SOFT" 40' }}
        >
          {body}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="btn-ghost disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="btn-stamp disabled:opacity-50"
          >
            {isPending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
