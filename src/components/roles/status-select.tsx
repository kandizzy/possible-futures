'use client';

import { useTransition } from 'react';
import { updateStatus } from '@/actions/calibrate';
import { getStatusStyle } from '@/lib/types';
import type { RoleStatus } from '@/lib/types';
import { useRouter } from 'next/navigation';

const STATUSES: RoleStatus[] = [
  'New',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
  'Ghosted',
  'Withdrawn',
  'Skipped',
];

export function StatusSelect({
  roleId,
  currentStatus,
}: {
  roleId: number;
  currentStatus: RoleStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('role_id', String(roleId));
      formData.set('status', e.target.value);
      await updateStatus(formData);
      router.refresh();
    });
  }

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      aria-label="Role status"
      className={`
        font-serif text-[14px] cursor-pointer pr-4
        hover:text-stamp transition-colors
        disabled:opacity-50
        ${getStatusStyle(currentStatus)}
      `}
      style={{ fontVariationSettings: '"opsz" 14, "SOFT" 50' }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.toLowerCase()}
        </option>
      ))}
    </select>
  );
}
