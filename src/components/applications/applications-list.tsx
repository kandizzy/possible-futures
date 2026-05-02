'use client';

import { useTransition } from 'react';
import { changeApplicationStatus } from '@/actions/applications';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Application } from '@/lib/types';
import { EmptyState } from '@/components/layout/editorial';
import { Select } from '@/components/layout/select';

const STATUSES = ['Submitted', 'Phone Screen', 'Interview', 'Take Home', 'Offer', 'Rejected', 'Withdrawn'];

type AppWithRole = Application & { role_title: string; role_company: string };

function getAppStatusStyle(status: string): string {
  switch (status) {
    case 'Submitted':
      return 'text-ink italic';
    case 'Phone Screen':
      return 'text-ink italic font-medium';
    case 'Interview':
      return 'text-stamp italic font-medium';
    case 'Take Home':
      return 'text-stamp italic';
    case 'Offer':
      return 'text-stamp italic font-semibold';
    case 'Rejected':
      return 'text-ink-3 italic line-through decoration-ink-3/50';
    case 'Withdrawn':
      return 'text-ink-3 italic line-through decoration-ink-3/50';
    default:
      return 'text-ink italic';
  }
}

function ApplicationRow({ app, index }: { app: AppWithRole; index: number }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('app_id', String(app.id));
      formData.set('status', newStatus);
      await changeApplicationStatus(formData);
      router.refresh();
    });
  }

  return (
    <li className="catalog-row py-5 px-1 hover:bg-paper-2/50 transition-colors">
      <div className="hidden md:grid grid-cols-[2.5rem_1fr_auto_auto_auto] items-center gap-x-8">
        <span className="font-mono tabular text-[10px] text-ink-3 self-start pt-1.5">
          {String(index).padStart(2, '0')}
        </span>

        <Link href={`/roles/${app.role_id}`} className="min-w-0 block group">
          <div
            className="font-serif text-[19px] leading-tight text-ink group-hover:text-stamp transition-colors tracking-[-0.01em] truncate"
            style={{ fontVariationSettings: '"opsz" 20, "SOFT" 40' }}
          >
            {app.role_company}
          </div>
          <div className="mt-1 text-[13px] text-ink-2 leading-snug truncate">
            {app.role_title}
          </div>
          {app.next_steps && (
            <div
              className="mt-1.5 font-serif italic text-[12px] text-ink-3 max-w-md truncate"
              style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
            >
              next: {app.next_steps}
            </div>
          )}
        </Link>

        <div className="smallcaps text-[9px] text-ink-3">
          {app.resume_version_used || '—'}
        </div>

        <div className="font-mono tabular text-[10px] text-ink-2 w-20 text-right">
          {app.date_applied || '—'}
        </div>

        <Select
          variant="inline"
          value={app.current_status}
          onChange={handleStatusChange}
          disabled={isPending}
          aria-label={`Status for ${app.role_title} at ${app.role_company}`}
          className={`font-serif text-[14px] text-right hover:text-stamp transition-colors min-w-[8rem] ${getAppStatusStyle(app.current_status)}`}
          style={{ fontVariationSettings: '"opsz" 14, "SOFT" 50' }}
          options={STATUSES.map((s) => ({ value: s, label: s.toLowerCase() }))}
        />
      </div>

      {/* Mobile stacked */}
      <div className="md:hidden">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <span className="font-mono tabular text-[9px] text-ink-3">
            {String(index).padStart(2, '0')}
          </span>
          <Select
            variant="inline"
            value={app.current_status}
            onChange={handleStatusChange}
            disabled={isPending}
            aria-label={`Status for ${app.role_title}`}
            className={`font-serif text-[13px] text-right hover:text-stamp transition-colors ${getAppStatusStyle(app.current_status)}`}
            style={{ fontVariationSettings: '"opsz" 13, "SOFT" 50' }}
            options={STATUSES.map((s) => ({ value: s, label: s.toLowerCase() }))}
          />
        </div>
        <Link href={`/roles/${app.role_id}`} className="block group">
          <div
            className="font-serif text-[18px] leading-tight text-ink group-hover:text-stamp transition-colors tracking-[-0.01em]"
            style={{ fontVariationSettings: '"opsz" 20, "SOFT" 40' }}
          >
            {app.role_company}
          </div>
          <div className="mt-0.5 text-[13px] text-ink-2 leading-snug">
            {app.role_title}
          </div>
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 text-[10px] text-ink-3 font-mono tabular">
          <span>{app.resume_version_used || '—'}</span>
          <span>{app.date_applied || 'not sent'}</span>
        </div>
        {app.next_steps && (
          <p
            className="mt-1.5 font-serif italic text-[12px] text-ink-3"
            style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
          >
            next: {app.next_steps}
          </p>
        )}
      </div>
    </li>
  );
}

export function ApplicationsList({ applications }: { applications: AppWithRole[] }) {
  if (applications.length === 0) {
    return (
      <EmptyState
        line="No applications tracked yet."
        actionLabel="Apply to a role from the dashboard"
        actionHref="/"
      />
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="smallcaps text-[9px] text-ink-3">
          {applications.length} {applications.length === 1 ? 'letter' : 'letters'}
        </div>
        <div className="hidden md:flex smallcaps text-[9px] text-ink-3 gap-10">
          <span>Ver.</span>
          <span>Date</span>
          <span>Status</span>
        </div>
      </div>
      <ol className="divide-y divide-rule-soft border-t border-b border-rule-soft">
        {applications.map((app, i) => (
          <ApplicationRow key={app.id} app={app} index={i + 1} />
        ))}
      </ol>
    </div>
  );
}
