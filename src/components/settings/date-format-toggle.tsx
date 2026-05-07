'use client';

import { useState, useTransition } from 'react';
import { updateDateFormat } from '@/actions/settings';
import { formatDate, type DateLocale } from '@/lib/format-date';

const SAMPLE_DATE = new Date(2026, 4, 3);

export function DateFormatToggle({ initialFormat }: { initialFormat: DateLocale }) {
  const [format, setFormat] = useState<DateLocale>(initialFormat);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleChoose(next: DateLocale) {
    if (next === format) return;
    setSaved(false);
    setFormat(next);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('date_format', next);
      await updateDateFormat(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="pt-4 mt-4 border-t border-rule-soft flex flex-wrap items-baseline gap-x-4 gap-y-2">
      <span className="smallcaps text-[9px] text-ink-3">Date format</span>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <FormatChoice
          active={format === 'us'}
          disabled={isPending}
          sample={formatDate(SAMPLE_DATE, 'us')}
          label="US"
          onClick={() => handleChoose('us')}
        />
        <span className="text-ink-3">·</span>
        <FormatChoice
          active={format === 'european'}
          disabled={isPending}
          sample={formatDate(SAMPLE_DATE, 'european')}
          label="European"
          onClick={() => handleChoose('european')}
        />
        <span className="text-ink-3">·</span>
        <FormatChoice
          active={format === 'iso'}
          disabled={isPending}
          sample={formatDate(SAMPLE_DATE, 'iso')}
          label="ISO"
          onClick={() => handleChoose('iso')}
        />
      </div>
      {saved && <span className="smallcaps text-[9px] text-stamp">Saved</span>}
    </div>
  );
}

function FormatChoice({
  active,
  disabled,
  sample,
  label,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  sample: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex items-baseline gap-2 disabled:opacity-50 transition-colors ${
        active ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
      }`}
    >
      <span
        className="font-serif italic text-[13px]"
        style={{ fontVariationSettings: '"opsz" 13, "SOFT" 50' }}
      >
        {sample}
      </span>
      <span className={`smallcaps text-[8px] ${active ? 'text-stamp' : ''}`}>
        {active ? `✓ ${label}` : label}
      </span>
    </button>
  );
}
