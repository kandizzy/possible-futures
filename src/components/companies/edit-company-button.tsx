'use client';

import { useState } from 'react';
import { CompanyFormModal } from './company-form-modal';

interface Props {
  companyId: number;
  name: string;
  category?: string | null;
  why_interested?: string | null;
  careers_url?: string | null;
  className?: string;
}

export function EditCompanyButton({
  companyId,
  name,
  category,
  why_interested,
  careers_url,
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          'font-serif italic text-[12px] text-ink-3 hover:text-stamp transition-colors'
        }
        title="Edit company"
      >
        edit
      </button>
      <CompanyFormModal
        mode="edit"
        open={open}
        onClose={() => setOpen(false)}
        companyId={companyId}
        initialValues={{
          name,
          category: category ?? '',
          why_interested: why_interested ?? '',
          careers_url: careers_url ?? '',
        }}
      />
    </>
  );
}
