'use client';

import { useState, useTransition } from 'react';
import { updateRoleMetadataAction } from '@/actions/roles';

export interface RoleHeaderEditorProps {
  role: {
    id: number;
    company: string;
    title: string;
    location: string | null;
    salary_range: string | null;
    url: string | null;
  };
  children: React.ReactNode;
}

/**
 * Wraps the role detail page's title block. Renders the existing display markup
 * (as children) in read mode, plus a small "edit" affordance that swaps in an
 * inline form. Save commits via server action; cancel restores.
 */
export function RoleHeaderEditor({ role, children }: RoleHeaderEditorProps) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="relative">
        {children}
        <button
          type="button"
          onClick={() => {
            setError(null);
            setEditing(true);
          }}
          className="mt-4 font-serif italic text-[12px] text-ink-3 hover:text-stamp transition-colors"
          style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
        >
          edit details →
        </button>
      </div>
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateRoleMetadataAction(formData);
      if (!res.ok) {
        setError(res.error ?? 'Failed to save.');
        return;
      }
      setEditing(false);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4 border border-rule bg-paper-2/40 p-5 md:p-6">
      <div className="smallcaps text-[9px] text-ink-3">Edit role details</div>
      <input type="hidden" name="id" value={role.id} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="smallcaps text-[8px] text-ink-3 block mb-1">Company *</label>
          <input
            type="text"
            name="company"
            defaultValue={role.company}
            required
            className="field w-full"
          />
        </div>
        <div>
          <label className="smallcaps text-[8px] text-ink-3 block mb-1">Title *</label>
          <input
            type="text"
            name="title"
            defaultValue={role.title}
            required
            className="field w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="smallcaps text-[8px] text-ink-3 block mb-1">Location</label>
          <input
            type="text"
            name="location"
            defaultValue={role.location ?? ''}
            placeholder="Remote, NYC, …"
            className="field w-full"
          />
        </div>
        <div>
          <label className="smallcaps text-[8px] text-ink-3 block mb-1">Salary range</label>
          <input
            type="text"
            name="salary_range"
            defaultValue={role.salary_range ?? ''}
            placeholder="$150-200k"
            className="field w-full"
          />
        </div>
      </div>

      <div>
        <label className="smallcaps text-[8px] text-ink-3 block mb-1">URL</label>
        <input
          type="url"
          name="url"
          defaultValue={role.url ?? ''}
          placeholder="https://..."
          className="field w-full"
        />
      </div>

      {error && (
        <p
          className="font-serif italic text-[13px] text-stamp"
          style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
        >
          {error}
        </p>
      )}

      <p
        className="font-serif italic text-[12px] text-ink-3"
        style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
      >
        Scores, fit summary, and the posting text are left alone. Those reflect the AI evaluation
        of the original text — editing the name of the company doesn&rsquo;t change what the AI already read.
      </p>

      <div className="flex items-center gap-4 pt-1">
        <button type="submit" disabled={isPending} className="btn-stamp disabled:opacity-50">
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
          disabled={isPending}
          className="btn-link"
        >
          cancel
        </button>
      </div>
    </form>
  );
}
