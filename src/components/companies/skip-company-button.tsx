'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { skipCompany } from '@/actions/companies';

/**
 * Soft-archives a company. Lands it in the Skipped section, where it can
 * be restored or permanently deleted. Use this anywhere you'd want to
 * dismiss a company without losing it.
 */
export function SkipCompanyButton({
  companyId,
  className,
}: {
  companyId: number;
  className?: string;
}) {
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
    <button
      type="button"
      onClick={handleSkip}
      disabled={isPending}
      className={
        className ??
        'font-serif italic text-[12px] text-ink-3 hover:text-stamp transition-colors disabled:opacity-50'
      }
      title="Skip this company — moves it to the Skipped section"
    >
      {isPending ? 'skipping…' : 'skip'}
    </button>
  );
}
