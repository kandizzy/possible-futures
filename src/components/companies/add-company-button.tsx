'use client';

import { useState } from 'react';
import { CompanyFormModal } from './company-form-modal';

export function AddCompanyButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost">
        Add company →
      </button>
      <CompanyFormModal mode="add" open={open} onClose={() => setOpen(false)} />
    </>
  );
}
