'use client';

import { createContext, useContext, useState, useTransition } from 'react';
import { updateRoleMetadataAction } from '@/actions/roles';

// Exposes the "start editing" callback down through children so the page can
// place the edit trigger inline (e.g., in the meta row) instead of having it
// stranded at the bottom of the header. We can't pass a render-prop children
// function across the Server→Client boundary, so we use context instead.
const EditDetailsContext = createContext<(() => void) | null>(null);

/**
 * Client component that renders the "edit details" affordance. Must be a
 * descendant of <RoleHeaderEditor> in read mode; renders nothing otherwise.
 * Place it wherever the edit link belongs visually.
 */
export function EditDetailsTrigger() {
  const startEditing = useContext(EditDetailsContext);
  if (!startEditing) return null;
  return (
    <button
      type="button"
      onClick={startEditing}
      className="font-serif italic text-[12px] text-ink-3 hover:text-stamp transition-colors"
      style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
    >
      edit details →
    </button>
  );
}

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
 * Wraps the role detail page's title block. In read mode, renders children
 * verbatim and exposes a start-editing callback via context so descendants
 * can render an <EditDetailsTrigger /> wherever they want. In edit mode,
 * swaps children for an inline form. Save commits via server action.
 */
export function RoleHeaderEditor({ role, children }: RoleHeaderEditorProps) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <EditDetailsContext.Provider
        value={() => {
          setError(null);
          setEditing(true);
        }}
      >
        {children}
      </EditDetailsContext.Provider>
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
