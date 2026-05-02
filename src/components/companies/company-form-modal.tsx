'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { addCompanyManually, autofillCompany, updateCompany } from '@/actions/companies';

export interface CompanyFormValues {
  name: string;
  category?: string;
  why_interested?: string;
  careers_url?: string;
}

interface BaseProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AddProps = BaseProps & { mode: 'add' };
type EditProps = BaseProps & {
  mode: 'edit';
  companyId: number;
  initialValues: CompanyFormValues;
};

type Props = AddProps | EditProps;

export function CompanyFormModal(props: Props) {
  const { open, onClose, onSuccess, mode } = props;
  const [isPending, startTransition] = useTransition();
  const [isAutofilling, startAutofilling] = useTransition();
  const [error, setError] = useState('');
  const [autofilled, setAutofilled] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const whyRef = useRef<HTMLTextAreaElement>(null);
  const careersRef = useRef<HTMLInputElement>(null);

  // Pre-fill values in edit mode; in add mode the inputs are uncontrolled and
  // start empty. Re-keyed below so edit-mode initialValues update when the
  // parent passes a different company.
  const initialValues =
    props.mode === 'edit' ? props.initialValues : { name: '', category: '', why_interested: '', careers_url: '' };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // In add mode, focus the name input. In edit mode, name is read-only,
      // so move focus to the first editable field (category).
      const target = mode === 'edit' ? dialog.querySelector('#company-category') : nameRef.current;
      setTimeout(() => (target as HTMLElement | null)?.focus(), 0);
    }
    if (!open && dialog.open) dialog.close();
  }, [open, mode]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      onClose();
      setError('');
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose();
  }

  function handleAutofill() {
    setError('');
    setAutofilled(false);
    const name = nameRef.current?.value.trim();
    if (!name) {
      setError('Type a company name first.');
      nameRef.current?.focus();
      return;
    }
    startAutofilling(async () => {
      const fd = new FormData();
      fd.set('name', name);
      const hintUrl = careersRef.current?.value.trim();
      if (hintUrl) fd.set('hint_url', hintUrl);
      const result = await autofillCompany(fd);
      if (!result.success || !result.result) {
        setError(result.error ?? 'Could not auto-fill.');
        return;
      }
      // Only fill empty fields. Important in edit mode so Claude doesn't
      // overwrite curated notes; in add mode the inputs are usually empty so
      // the rule is equivalent. To re-fill a field, clear it first.
      const fillIfEmpty = (
        ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
        value: string | null,
      ) => {
        if (!ref.current || !value) return;
        if (ref.current.value.trim() === '') ref.current.value = value;
      };
      fillIfEmpty(categoryRef, result.result.category);
      fillIfEmpty(whyRef, result.result.why_interested);
      fillIfEmpty(careersRef, result.result.careers_url);
      setAutofilled(true);
    });
  }

  function handleSubmit(formData: FormData) {
    setError('');
    startTransition(async () => {
      let result: { success: boolean; error?: string };
      if (mode === 'add') {
        result = await addCompanyManually(formData);
      } else {
        formData.set('id', String(props.companyId));
        result = await updateCompany(formData);
      }
      if (result.success) {
        onClose();
        onSuccess?.();
      } else {
        setError(result.error ?? 'Could not save.');
      }
    });
  }

  const title = mode === 'add' ? 'Track manually' : 'Edit company';
  const eyebrow = mode === 'add' ? 'Add a company' : 'Edit';
  const submitLabel = mode === 'add' ? 'Add to watchlist →' : 'Save changes →';
  const pendingLabel = mode === 'add' ? 'Adding…' : 'Saving…';
  const subtitle =
    mode === 'add'
      ? 'Fill in what you know — or hit Auto-fill → to let Claude take a first pass at category, why interested, and careers URL.'
      : 'Update your notes, or hit Auto-fill → to let Claude top up any empty fields. Name is locked because existing roles reference it.';

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="bg-transparent backdrop:bg-ink/30 backdrop:backdrop-blur-[1px] p-0 max-w-lg w-[calc(100%-2rem)] m-auto fixed inset-0"
    >
      {/* Re-key the form on initialValues change so edit-mode pre-fills update
          when the user opens a different company. */}
      <form
        key={mode === 'edit' ? props.companyId : 'add'}
        action={handleSubmit}
        className="bg-paper border border-ink shadow-[4px_4px_0_var(--ink)] p-8 space-y-5"
      >
        <div className="smallcaps text-[9px] text-ink-3">{eyebrow}</div>
        <h2
          className="font-serif text-[26px] leading-[1.1] text-ink tracking-[-0.01em]"
          style={{ fontVariationSettings: '"opsz" 36, "SOFT" 50' }}
        >
          {title}
        </h2>
        <p
          className="font-serif italic text-[13px] text-ink-2 leading-snug"
          style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
        >
          {subtitle}
        </p>

        <div className="space-y-4 pt-2">
          <div>
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <label htmlFor="company-name" className="smallcaps text-[9px] text-ink-3">
                Name {mode === 'add' && <span className="text-stamp">*</span>}
              </label>
              <button
                type="button"
                onClick={handleAutofill}
                disabled={isPending || isAutofilling}
                className="font-serif italic text-[12px] text-ink-2 hover:text-stamp transition-colors disabled:opacity-50"
                style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
                title={
                  mode === 'edit'
                    ? 'Use AI to fill in any empty fields'
                    : 'Use AI to fill in details'
                }
              >
                {isAutofilling ? 'Auto-filling…' : 'Auto-fill →'}
              </button>
            </div>
            <input
              ref={nameRef}
              id="company-name"
              name="name"
              type="text"
              required={mode === 'add'}
              disabled={isPending || mode === 'edit'}
              defaultValue={initialValues.name}
              readOnly={mode === 'edit'}
              className={`field w-full ${mode === 'edit' ? 'bg-paper-2/40 cursor-not-allowed text-ink-2' : ''}`}
              placeholder="e.g. Field Studies"
            />
          </div>

          <div>
            <label htmlFor="company-category" className="smallcaps text-[9px] text-ink-3 block mb-2">
              Category
            </label>
            <input
              ref={categoryRef}
              id="company-category"
              name="category"
              type="text"
              disabled={isPending}
              defaultValue={initialValues.category ?? ''}
              className="field w-full"
              placeholder="e.g. Design tools, Civic tech, AI research"
            />
          </div>

          <div>
            <label htmlFor="company-why" className="smallcaps text-[9px] text-ink-3 block mb-2">
              Why interested
            </label>
            <textarea
              ref={whyRef}
              id="company-why"
              name="why_interested"
              rows={3}
              disabled={isPending}
              defaultValue={initialValues.why_interested ?? ''}
              className="field w-full font-serif text-[14px] leading-snug resize-y"
              style={{ fontVariationSettings: '"opsz" 14, "SOFT" 30' }}
              placeholder="A line or two on what makes this house worth watching."
            />
          </div>

          <div>
            <label htmlFor="company-careers" className="smallcaps text-[9px] text-ink-3 block mb-2">
              Careers URL
            </label>
            <input
              ref={careersRef}
              id="company-careers"
              name="careers_url"
              type="url"
              disabled={isPending}
              defaultValue={initialValues.careers_url ?? ''}
              className="field w-full"
              placeholder="https://…"
            />
          </div>
        </div>

        {autofilled && (
          <p
            className="font-serif italic text-[12px] text-ink-3"
            style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
          >
            Auto-filled by Claude — review before saving.
          </p>
        )}

        {error && <p className="font-serif italic text-[13px] text-stamp">{error}</p>}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="btn-ghost disabled:opacity-50"
          >
            Cancel
          </button>
          <button type="submit" disabled={isPending} className="btn-stamp disabled:opacity-50">
            {isPending ? pendingLabel : submitLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
