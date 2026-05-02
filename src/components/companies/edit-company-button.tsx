'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyFormModal } from './company-form-modal';

interface Props {
  companyId: number;
  name: string;
  category?: string | null;
  why_interested?: string | null;
  careers_url?: string | null;
  ats_provider?: string | null;
  ats_slug?: string | null;
  className?: string;
}

export function EditCompanyButton({
  companyId,
  name,
  category,
  why_interested,
  careers_url,
  ats_provider,
  ats_slug,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
        onSuccess={() => router.refresh()}
        companyId={companyId}
        initialValues={{
          name,
          category: category ?? '',
          why_interested: why_interested ?? '',
          careers_url: careers_url ?? '',
          ats_provider: (ats_provider ?? null) as never,
          ats_slug: ats_slug ?? '',
        }}
      />
    </>
  );
}
