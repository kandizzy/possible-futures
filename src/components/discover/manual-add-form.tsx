'use client';

import { useState, useTransition } from 'react';
import { addCompanyManually } from '@/actions/discover';

export function ManualAddForm({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addCompanyManually(formData);
      if (!res.ok) {
        setError(res.error ?? 'Failed to add company.');
        return;
      }
      onSaved();
    });
  }

  return (
    <form action={handleSubmit} className="border border-rule bg-paper-2/40 p-5 md:p-6 space-y-4">
      <div className="smallcaps text-[9px] text-ink-3">Add manually</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="smallcaps text-[8px] text-ink-3 block mb-1">Name *</label>
          <input
            type="text"
            name="name"
            required
            placeholder="Company name"
            className="field w-full"
          />
        </div>
        <div>
          <label className="smallcaps text-[8px] text-ink-3 block mb-1">Category</label>
          <input
            type="text"
            name="category"
            placeholder="AI tooling, Museums, Design tools…"
            className="field w-full"
          />
        </div>
      </div>

      <div>
        <label className="smallcaps text-[8px] text-ink-3 block mb-1">Why interested</label>
        <input
          type="text"
          name="why_interested"
          placeholder="One sentence. Why does this company matter to you?"
          className="field w-full"
        />
      </div>

      <div>
        <label className="smallcaps text-[8px] text-ink-3 block mb-1">Careers URL</label>
        <input
          type="url"
          name="careers_url"
          placeholder="https://..."
          className="field w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="smallcaps text-[8px] text-ink-3 block mb-1">ATS provider</label>
          <select name="ats_provider" className="field w-full">
            <option value="">— none —</option>
            <option value="greenhouse">Greenhouse</option>
            <option value="lever">Lever</option>
            <option value="ashby">Ashby</option>
            <option value="workable">Workable</option>
          </select>
        </div>
        <div>
          <label className="smallcaps text-[8px] text-ink-3 block mb-1">ATS slug</label>
          <input
            type="text"
            name="ats_slug"
            placeholder="e.g. anthropic"
            className="field w-full"
          />
        </div>
      </div>

      {error && (
        <p
          className="font-serif italic text-[13px] text-stamp"
          style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={isPending} className="btn-stamp disabled:opacity-50">
          {isPending ? 'Saving…' : 'Add company →'}
        </button>
        <button type="button" onClick={onCancel} className="btn-link">
          cancel
        </button>
      </div>
    </form>
  );
}
