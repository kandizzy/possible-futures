'use client';

import { useState } from 'react';

export function ConfirmRemove({
  label,
  onConfirm,
}: {
  label?: string;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-baseline gap-2">
        <span className="font-mono text-[11px] text-stamp">
          {label || 'remove'}?
        </span>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            setConfirming(false);
          }}
          className="font-mono text-[11px] text-stamp hover:text-stamp-deep transition-colors cursor-pointer underline decoration-stamp/40 hover:decoration-stamp"
        >
          yes
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="font-mono text-[11px] text-ink-3 hover:text-ink transition-colors cursor-pointer"
        >
          no
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="font-mono text-[11px] text-ink-3 hover:text-stamp transition-colors cursor-pointer"
    >
      {label || 'remove'}
    </button>
  );
}
