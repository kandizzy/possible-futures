'use client';

import { useState, useTransition } from 'react';
import { changeApplicationStatus } from '@/actions/applications';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Application } from '@/lib/types';
import { EmptyState } from '@/components/layout/editorial';
import { Select } from '@/components/layout/select';
import { formatDate, type DateLocale } from '@/lib/format-date';

const STATUSES = ['Submitted', 'Phone Screen', 'Interview', 'Take Home', 'Offer', 'Rejected', 'Ghosted', 'Withdrawn'];

// Shared column template for the header and every row, so the labels line up
// with the data beneath them. Trailing tracks are fixed (not `auto`) because
// the header and rows are separate grids — only fixed widths align across them.
const GRID = 'grid-cols-[2.5rem_minmax(0,1fr)_4rem_8rem_8rem] gap-x-8';

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
    case 'Ghosted':
      // Limbo, not a conclusion — muted but no strikethrough.
      return 'text-ink-3 italic';
    case 'Withdrawn':
      return 'text-ink-3 italic line-through decoration-ink-3/50';
    default:
      return 'text-ink italic';
  }
}

function ApplicationRow({ app, index, dateLocale }: { app: AppWithRole; index: number; dateLocale: DateLocale }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  // Picking a new status doesn't commit immediately — it opens a note panel
  // so the change can carry a record (e.g. what a recruiter said). The note
  // is optional: Save it to put the moment on the timeline, or Skip and the
  // status still changes without landing in history.
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [note, setNote] = useState('');

  function handleStatusPick(newStatus: string) {
    if (newStatus === app.current_status) return;
    setNote('');
    setPendingStatus(newStatus);
  }

  function cancelChange() {
    setPendingStatus(null);
    setNote('');
  }

  function commitChange(withNote: boolean) {
    if (!pendingStatus) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set('app_id', String(app.id));
      formData.set('status', pendingStatus);
      if (withNote && note.trim()) formData.set('note', note.trim());
      await changeApplicationStatus(formData);
      setPendingStatus(null);
      setNote('');
      router.refresh();
    });
  }

  return (
    <li className="catalog-row py-5 px-1 hover:bg-paper-2/50 transition-colors">
      <div className={`hidden md:grid ${GRID} items-center`}>
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

        <div className="font-mono tabular text-[10px] text-ink-2 text-right">
          {app.date_applied ? formatDate(app.date_applied, dateLocale) : '—'}
        </div>

        <div className="flex justify-end">
          <Select
            variant="inline"
            value={app.current_status}
            onChange={handleStatusPick}
            disabled={isPending}
            aria-label={`Status for ${app.role_title} at ${app.role_company}`}
            className={`font-serif text-[14px] text-right hover:text-stamp transition-colors ${getAppStatusStyle(app.current_status)}`}
            style={{ fontVariationSettings: '"opsz" 14, "SOFT" 50' }}
            options={STATUSES.map((s) => ({ value: s, label: s.toLowerCase() }))}
          />
        </div>
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
            onChange={handleStatusPick}
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
          <span>{app.date_applied ? formatDate(app.date_applied, dateLocale) : 'not sent'}</span>
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

      {/* Note panel — revealed after a new status is picked, before commit */}
      {pendingStatus && (
        <div className="mt-4 border-t border-rule-soft pt-4">
          <div className="smallcaps text-[9px] text-ink-3 mb-2">
            {app.current_status.toLowerCase()} → {pendingStatus.toLowerCase()}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note this change for your journey — or skip it"
            rows={3}
            autoFocus
            disabled={isPending}
            className="field w-full font-serif text-[13px] leading-[1.6] resize-y"
            style={{ fontVariationSettings: '"opsz" 13, "SOFT" 30' }}
          />
          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              onClick={() => commitChange(true)}
              disabled={isPending || !note.trim()}
              className="btn-stamp text-[12px] disabled:opacity-40"
            >
              {isPending ? 'Saving' : 'Save note'}
            </button>
            <button
              type="button"
              onClick={() => commitChange(false)}
              disabled={isPending}
              className="btn-link text-[12px]"
            >
              skip
            </button>
            <button
              type="button"
              onClick={cancelChange}
              disabled={isPending}
              className="btn-link text-[12px] text-ink-3 ml-auto"
            >
              cancel
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export function ApplicationsList({
  applications,
  dateLocale,
}: {
  applications: AppWithRole[];
  dateLocale: DateLocale;
}) {
  if (applications.length === 0) {
    return (
      <EmptyState
        line="No applications tracked yet."
        actionLabel="Apply to a role from the dashboard"
        actionHref="/"
      />
    );
  }

  const count = `${applications.length} ${applications.length === 1 ? 'letter' : 'letters'}`;

  return (
    <div>
      {/* Mobile: just the count. Desktop: column headers aligned to the row
          grid via the shared GRID template. */}
      <div className="smallcaps text-[9px] text-ink-3 mb-2 md:hidden">{count}</div>
      <div className={`hidden md:grid ${GRID} items-baseline mb-2 px-1 smallcaps text-[9px] text-ink-3`}>
        <span className="whitespace-nowrap">{count}</span>
        <span />
        <span>Ver.</span>
        <span className="text-right">Date</span>
        <span className="text-right">Status</span>
      </div>
      <ol className="divide-y divide-rule-soft border-t border-b border-rule-soft">
        {applications.map((app, i) => (
          <ApplicationRow key={app.id} app={app} index={i + 1} dateLocale={dateLocale} />
        ))}
      </ol>
    </div>
  );
}
