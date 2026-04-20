'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addPerson } from '@/actions/people';

export function AddPersonForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError('');
    startTransition(async () => {
      const result = await addPerson(formData);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        formRef.current?.reset();
        router.refresh();
      } else {
        setError(result.error || 'Failed to add person.');
      }
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost">
        ＋ Add person
      </button>
    );
  }

  return (
    <div className="p-6 border border-rule bg-paper-2/40">
      <div className="flex items-baseline justify-between mb-5">
        <h3
          className="font-serif text-[20px] leading-none text-ink"
          style={{ fontVariationSettings: '"opsz" 20, "SOFT" 40' }}
        >
          New correspondent
        </h3>
        <div className="flex items-baseline gap-3">
          {saved && <span className="smallcaps text-[9px] text-stamp">Added</span>}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-link"
          >
            close
          </button>
        </div>
      </div>

      <form ref={formRef} action={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" name="name" placeholder="Name *" required className="field" />
          <input type="text" name="role" placeholder="Role" className="field" />
          <input type="text" name="company" placeholder="Company" className="field" />
          <input type="text" name="url" placeholder="Profile URL" className="field" />
        </div>
        {error && (
          <p className="font-serif italic text-[13px] text-stamp">{error}</p>
        )}
        <button type="submit" disabled={isPending} className="btn-stamp">
          {isPending ? 'Adding' : 'Add person'}
        </button>
      </form>
    </div>
  );
}
