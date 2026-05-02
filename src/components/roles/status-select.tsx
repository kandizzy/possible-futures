'use client';

import { useTransition } from 'react';
import { updateStatus } from '@/actions/calibrate';
import { getStatusStyle } from '@/lib/types';
import type { RoleStatus } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/layout/select';

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

  function handleChange(value: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('role_id', String(roleId));
      formData.set('status', value);
      await updateStatus(formData);
      router.refresh();
    });
  }

  return (
    <Select
      variant="inline"
      value={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      aria-label="Role status"
      className={`font-serif text-[14px] hover:text-stamp transition-colors ${getStatusStyle(currentStatus)}`}
      style={{ fontVariationSettings: '"opsz" 14, "SOFT" 50' }}
      options={STATUSES.map((s) => ({ value: s, label: s.toLowerCase() }))}
    />
  );
}
