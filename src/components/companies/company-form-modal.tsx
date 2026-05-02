'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { addCompanyManually, autofillCompany, updateCompany } from '@/actions/companies';
import { Select } from '@/components/layout/select';
import { LoadingDots } from '@/components/layout/editorial';
import type { AtsProvider } from '@/lib/types';

export interface CompanyFormValues {
  name: string;
  category?: string;
  why_interested?: string;
  careers_url?: string;
  ats_provider?: AtsProvider | null;
  ats_slug?: string | null;
}

const ATS_OPTIONS = [
  { value: 'greenhouse', label: 'Greenhouse' },
  { value: 'ashby', label: 'Ashby' },
  { value: 'workable', label: 'Workable' },
  { value: 'lever', label: 'Lever' },
];

interface BaseProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful save with the saved company's name and id. */
  onSuccess?: (info: { name: string; companyId: number | null }) => void;
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
  const atsSlugRef = useRef<HTMLInputElement>(null);

  // Pre-fill values in edit mode; in add mode the inputs are uncontrolled and
  // start empty. Re-keyed below so edit-mode initialValues update when the
  // parent passes a different company.
  const initialValues: CompanyFormValues =
    props.mode === 'edit'
      ? props.initialValues
      : { name: '', category: '', why_interested: '', careers_url: '', ats_provider: null, ats_slug: '' };
  // ATS provider is rendered via the controlled <Select>, so it needs its
  // own state. Reset whenever the modal opens.
  const [atsProvider, setAtsProvider] = useState<string>(initialValues.ats_provider ?? '');
  useEffect(() => {
    if (open) setAtsProvider(initialValues.ats_provider ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, props.mode === 'edit' ? props.companyId : null]);

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
      let filledAny = false;
      const fillIfEmpty = (
        ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
        value: string | null,
      ) => {
        if (!ref.current || !value) return;
        if (ref.current.value.trim() === '') {
          ref.current.value = value;
          filledAny = true;
        }
      };
      fillIfEmpty(categoryRef, result.result.category);
      fillIfEmpty(whyRef, result.result.why_interested);
      fillIfEmpty(careersRef, result.result.careers_url);
      // ATS guesses go into separate state + ref. Only fill when empty.
      if (result.result.guessed_ats_provider && !atsProvider) {
        setAtsProvider(result.result.guessed_ats_provider);
        filledAny = true;
      }
      fillIfEmpty(atsSlugRef, result.result.guessed_ats_slug);

      if (filledAny) {
        setAutofilled(true);
        return;
      }

      // Nothing got filled. Distinguish "Claude didn't recognize the company"
      // (prompt forbids fabrication, returns all-nulls) from "everything was
      // already filled" so the user gets specific feedback instead of a
      // silent no-op.
      const claudeReturnedNothing =
        !result.result.category &&
        !result.result.why_interested &&
        !result.result.careers_url &&
        !result.result.guessed_ats_provider &&
        !result.result.guessed_ats_slug;
      if (claudeReturnedNothing) {
        setError(
          `Claude didn't recognize "${nameRef.current?.value.trim()}". Type the details yourself, or add a careers URL above as a hint and try again.`,
        );
      } else {
        setError(
          'All fields already have content. Clear a field and click Auto-fill again to re-fill it.',
        );
      }
    });
  }

  function handleSubmit(formData: FormData) {
    setError('');
    // Inject controlled state values that aren't tied to a native input.
    formData.set('ats_provider', atsProvider);
    startTransition(async () => {
      let result: { success: boolean; error?: string; companyId?: number };
      let savedName: string;
      if (mode === 'add') {
        savedName = ((formData.get('name') as string) || '').trim();
        result = await addCompanyManually(formData);
      } else {
        formData.set('id', String(props.companyId));
        savedName = props.initialValues.name;
        result = await updateCompany(formData);
      }
      if (result.success) {
        onClose();
        onSuccess?.({
          name: savedName,
          companyId: result.companyId ?? (mode === 'edit' ? props.companyId : null),
        });
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
                className="inline-flex items-center gap-2 font-serif italic text-[12px] text-ink-2 hover:text-stamp transition-colors disabled:opacity-100"
                style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
                title={
                  mode === 'edit'
                    ? 'Use AI to fill in any empty fields'
                    : 'Use AI to fill in details'
                }
              >
                {isAutofilling ? (
                  <>
                    <span className="text-stamp">Auto-filling</span>
                    <LoadingDots />
                  </>
                ) : (
                  'Auto-fill →'
                )}
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

          {/* ATS — optional. Auto-fill populates these as best-guess; users
              can also edit them later via the Edit modal or the inline ATS
              indicator on the Watchlist row. */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-3">
            <div>
              <label className="smallcaps text-[9px] text-ink-3 block mb-2">
                ATS provider
              </label>
              <Select
                fullWidth
                allowEmpty
                emptyLabel="— none —"
                value={atsProvider}
                onChange={(v) => setAtsProvider(v)}
                disabled={isPending}
                options={ATS_OPTIONS}
              />
            </div>
            <div>
              <label
                htmlFor="company-ats-slug"
                className="smallcaps text-[9px] text-ink-3 block mb-2"
              >
                ATS slug
              </label>
              <input
                ref={atsSlugRef}
                id="company-ats-slug"
                name="ats_slug"
                type="text"
                disabled={isPending}
                defaultValue={initialValues.ats_slug ?? ''}
                className="field w-full font-mono text-[12px]"
                placeholder="e.g. anthropic"
              />
            </div>
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
