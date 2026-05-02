'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyFormModal } from './company-form-modal';

export function AddCompanyButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost">
        Add company →
      </button>
      <CompanyFormModal
        mode="add"
        open={open}
        onClose={() => setOpen(false)}
        // revalidatePath updates the server cache, but the user is already on
        // /companies — we need router.refresh() to actually re-render with
        // the new data so they SEE the row appear.
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
