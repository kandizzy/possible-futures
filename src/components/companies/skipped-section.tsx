'use client';

import { useTransition } from 'react';
import { unskipCompany } from '@/actions/companies';
import type { Company } from '@/lib/types';

export function SkippedSection({ companies }: { companies: Company[] }) {
  if (companies.length === 0) return null;

  return (
    <section>
      <details>
        <summary className="flex items-baseline justify-between pb-2 border-b border-rule cursor-pointer list-none [&::-webkit-details-marker]:hidden marker:hidden outline-none select-none">
          <h2 className="smallcaps text-[10px] text-ink-3">
            Skipped
            <span className="font-mono tabular text-[10px] text-ink-3 ml-2">
              {String(companies.length).padStart(2, '0')}
            </span>
          </h2>
          <span className="font-serif italic text-[12px] text-ink-3 hover:text-stamp transition-colors">
            toggle
          </span>
        </summary>

        <div className="mt-5">
          <p
            className="font-serif italic text-[13px] text-ink-3 mb-4 max-w-2xl"
            style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
          >
            Companies you skipped during Discover. They&apos;re excluded from future
            suggestions. Restore one to bring it back into the watchlist and let it
            re-appear in Discover runs.
          </p>
          <ol className="divide-y divide-rule-soft">
            {companies.map((c) => (
              <SkippedRow key={c.id} company={c} />
            ))}
          </ol>
        </div>
      </details>
    </section>
  );
}

function SkippedRow({ company }: { company: Company }) {
  const [isPending, startTransition] = useTransition();

  function handleRestore() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', String(company.id));
      await unskipCompany(fd);
    });
  }

  return (
    <li className="py-2.5 px-1 flex items-baseline justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className="font-serif text-[15px] text-ink"
            style={{ fontVariationSettings: '"opsz" 16, "SOFT" 40' }}
          >
            {company.name}
          </span>
          {company.category && (
            <span className="smallcaps text-[8px] text-ink-3">{company.category}</span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={handleRestore}
        disabled={isPending}
        className="font-serif italic text-[12px] text-ink-2 hover:text-stamp transition-colors disabled:opacity-50 shrink-0"
        style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
      >
        {isPending ? 'restoring…' : 'restore →'}
      </button>
    </li>
  );
}
