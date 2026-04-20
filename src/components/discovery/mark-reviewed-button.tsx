'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markDiscoveredRoleReviewed } from '@/actions/discovery';

export function MarkReviewedButton({ roleId }: { roleId: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('role_id', String(roleId));
      await markDiscoveredRoleReviewed(formData);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="smallcaps text-[9px] text-stamp hover:text-stamp-deep transition-colors underline decoration-stamp/40 underline-offset-2 disabled:opacity-50"
    >
      {isPending ? 'marking…' : 'mark reviewed'}
    </button>
  );
}
