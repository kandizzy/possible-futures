'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { skipCompany } from '@/actions/companies';
import { ActionMenu } from '@/components/layout/action-menu';
import { PencilIconSvg } from '@/components/layout/icons';
import { CompanyFormModal } from './company-form-modal';

interface Props {
  companyId: number;
  name: string;
  category?: string | null;
  why_interested?: string | null;
  careers_url?: string | null;
  ats_provider?: string | null;
  ats_slug?: string | null;
}

/**
 * Top-right cluster on a CompanyCard — single pencil icon that opens an
 * action menu with Edit + Skip. Replaces the previous "edit · skip" text
 * cluster so the card visual stays clean and Discover-shaped.
 */
export function CompanyActionsMenu({
  companyId,
  name,
  category,
  why_interested,
  careers_url,
  ats_provider,
  ats_slug,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSkip() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', String(companyId));
      await skipCompany(fd);
      router.refresh();
    });
  }

  return (
    <>
      <ActionMenu
        trigger={<PencilIconSvg size={15} />}
        triggerLabel={`Actions for ${name}`}
        items={[
          { label: 'Edit', onClick: () => setEditOpen(true), disabled: isPending },
          {
            label: isPending ? 'Skipping…' : 'Skip',
            onClick: handleSkip,
            destructive: true,
            disabled: isPending,
          },
        ]}
      />
      <CompanyFormModal
        mode="edit"
        open={editOpen}
        onClose={() => setEditOpen(false)}
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
