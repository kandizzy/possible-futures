'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { addCompanyManually } from '@/actions/companies';

export function AddCompanyButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Focus the name input shortly after open so the dialog's default focus
      // (Cancel button, picked because of native focus order) doesn't land on
      // a destructive control.
      setTimeout(() => nameRef.current?.focus(), 0);
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      setOpen(false);
      setError('');
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, []);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) setOpen(false);
  }

  function handleSubmit(formData: FormData) {
    setError('');
    startTransition(async () => {
      const result = await addCompanyManually(formData);
      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error ?? 'Could not add company.');
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost">
        Add company →
      </button>

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        className="bg-transparent backdrop:bg-ink/30 backdrop:backdrop-blur-[1px] p-0 max-w-lg w-[calc(100%-2rem)] m-auto fixed inset-0"
      >
        <form
          action={handleSubmit}
          className="bg-paper border border-ink shadow-[4px_4px_0_var(--ink)] p-8 space-y-5"
        >
          <div className="smallcaps text-[9px] text-ink-3">Add a company</div>
          <h2
            className="font-serif text-[26px] leading-[1.1] text-ink tracking-[-0.01em]"
            style={{ fontVariationSettings: '"opsz" 36, "SOFT" 50' }}
          >
            Track manually
          </h2>
          <p
            className="font-serif italic text-[13px] text-ink-2 leading-snug"
            style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
          >
            No AI tokens, no Discover run. The company lands in your Watchlist with whatever you know about it.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <label
                htmlFor="company-name"
                className="smallcaps text-[9px] text-ink-3 block mb-2"
              >
                Name <span className="text-stamp">*</span>
              </label>
              <input
                ref={nameRef}
                id="company-name"
                name="name"
                type="text"
                required
                disabled={isPending}
                className="field w-full"
                placeholder="e.g. Field Studies"
              />
            </div>

            <div>
              <label
                htmlFor="company-category"
                className="smallcaps text-[9px] text-ink-3 block mb-2"
              >
                Category
              </label>
              <input
                id="company-category"
                name="category"
                type="text"
                disabled={isPending}
                className="field w-full"
                placeholder="e.g. Design tools, Civic tech, AI research"
              />
            </div>

            <div>
              <label
                htmlFor="company-why"
                className="smallcaps text-[9px] text-ink-3 block mb-2"
              >
                Why interested
              </label>
              <textarea
                id="company-why"
                name="why_interested"
                rows={3}
                disabled={isPending}
                className="field w-full font-serif text-[14px] leading-snug resize-y"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 30' }}
                placeholder="A line or two on what makes this house worth watching."
              />
            </div>

            <div>
              <label
                htmlFor="company-careers"
                className="smallcaps text-[9px] text-ink-3 block mb-2"
              >
                Careers URL
              </label>
              <input
                id="company-careers"
                name="careers_url"
                type="url"
                disabled={isPending}
                className="field w-full"
                placeholder="https://…"
              />
            </div>
          </div>

          {error && (
            <p className="font-serif italic text-[13px] text-stamp">{error}</p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="btn-ghost disabled:opacity-50"
            >
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="btn-stamp disabled:opacity-50">
              {isPending ? 'Adding…' : 'Add to watchlist →'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
