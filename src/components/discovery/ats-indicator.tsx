'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { detectCompanyAts, setAtsForCompany } from '@/actions/discovery';
import { getAtsBoardUrl } from '@/lib/ats/board-url';
import { Select } from '@/components/layout/select';
import type { AtsProvider } from '@/lib/types';

const PROVIDERS: AtsProvider[] = ['greenhouse', 'lever', 'ashby', 'workable'];

interface Props {
  companyId: number;
  careersUrl: string | null;
  atsProvider: AtsProvider | null | undefined;
  atsSlug: string | null | undefined;
  lastScannedAt: string | null | undefined;
}

export function AtsIndicator({
  companyId,
  careersUrl,
  atsProvider,
  atsSlug,
  lastScannedAt,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const router = useRouter();

  function handleDetect() {
    setError('');
    startTransition(async () => {
      const res = await detectCompanyAts(companyId);
      if (!res.success) {
        setError(res.error);
        return;
      }
      if (!res.detected) {
        setError('Could not detect ATS from careers URL.');
        return;
      }
      router.refresh();
    });
  }

  function handleSave(formData: FormData) {
    setError('');
    formData.set('company_id', String(companyId));
    startTransition(async () => {
      const res = await setAtsForCompany(formData);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function handleClear() {
    setError('');
    startTransition(async () => {
      const formData = new FormData();
      formData.set('company_id', String(companyId));
      formData.set('provider', '');
      formData.set('slug', '');
      await setAtsForCompany(formData);
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <form action={handleSave} className="flex flex-wrap items-baseline gap-2">
        <Select
          name="provider"
          defaultValue={atsProvider || ''}
          className="font-serif italic text-[12px]"
          style={{ fontVariationSettings: '"opsz" 12, "SOFT" 50' }}
          allowEmpty
          emptyLabel="none"
          options={PROVIDERS.map((p) => ({ value: p, label: p }))}
        />
        <input
          type="text"
          name="slug"
          defaultValue={atsSlug || ''}
          placeholder="slug"
          className="field w-32 font-mono text-[11px]"
        />
        <button type="submit" disabled={isPending} className="btn-link">
          save
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError('');
          }}
          className="btn-link"
        >
          cancel
        </button>
        <button type="button" onClick={handleClear} className="btn-link text-ink-3">
          clear
        </button>
        {error && (
          <span
            className="font-serif italic text-[11px] text-stamp"
            style={{ fontVariationSettings: '"opsz" 11, "SOFT" 40' }}
          >
            {error}
          </span>
        )}
      </form>
    );
  }

  if (atsProvider && atsSlug) {
    return (
      <div className="inline-flex items-baseline gap-3 font-mono tabular text-[10px]">
        <a
          href={getAtsBoardUrl(atsProvider, atsSlug)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-baseline gap-1 text-ink-2 hover:text-stamp transition-colors underline decoration-rule hover:decoration-stamp"
          title={`Open ${atsProvider}/${atsSlug}`}
        >
          <span className="text-ink-3 no-underline">{atsProvider}</span>
          <span>·</span>
          <span>{atsSlug}</span>
        </a>
        {lastScannedAt && (
          <span className="text-ink-3 italic">last {lastScannedAt.slice(0, 10)}</span>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-ink-3 hover:text-stamp transition-colors italic"
          title="Edit ATS"
        >
          edit
        </button>
      </div>
    );
  }

  if (careersUrl) {
    return (
      <div className="flex flex-wrap items-baseline gap-3">
        <button
          type="button"
          onClick={handleDetect}
          disabled={isPending}
          className="btn-link"
        >
          {isPending ? 'detecting…' : 'detect →'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="font-mono text-[11px] text-ink-3 hover:text-stamp transition-colors cursor-pointer underline decoration-rule hover:decoration-stamp"
        >
          set manually
        </button>
        {error && (
          <span
            className="font-serif italic text-[11px] text-stamp"
            style={{ fontVariationSettings: '"opsz" 11, "SOFT" 40' }}
          >
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="font-mono text-[11px] text-ink-3 hover:text-stamp transition-colors cursor-pointer underline decoration-rule hover:decoration-stamp"
    >
      set manually
    </button>
  );
}
