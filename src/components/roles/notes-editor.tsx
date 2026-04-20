'use client';

import { useState, useTransition } from 'react';
import { updateNotes } from '@/actions/calibrate';

export function NotesEditor({
  roleId,
  initialNotes,
}: {
  roleId: number;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('role_id', String(roleId));
      formData.set('notes', notes);
      await updateNotes(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        placeholder="Private margin notes…"
        className="field w-full font-serif text-[15px] leading-[1.65] resize-y"
        style={{ fontVariationSettings: '"opsz" 15, "SOFT" 30' }}
      />
      <div className="mt-3 flex items-center justify-between">
        <div className="smallcaps text-[8px] text-ink-3">
          {saved ? (
            <span className="text-stamp">saved</span>
          ) : (
            <span>Press save when you're finished</span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="btn-ghost disabled:opacity-50"
        >
          {isPending ? 'Saving' : 'Save notes'}
        </button>
      </div>
    </div>
  );
}
