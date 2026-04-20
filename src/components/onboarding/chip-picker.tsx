'use client';

import { useState } from 'react';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  /** Style accent for chips — affects color. */
  accent?: 'ink' | 'stamp';
  /** Optional wrap for chip display, e.g. quote marks. */
  quoted?: boolean;
  maxItems?: number;
}

export function ChipPicker({
  value,
  onChange,
  placeholder = 'Add…',
  suggestions,
  accent = 'ink',
  quoted = false,
  maxItems,
}: Props) {
  const [draft, setDraft] = useState('');

  function commit(raw?: string) {
    const text = (raw ?? draft).trim();
    if (!text) return;
    if (value.some((v) => v.toLowerCase() === text.toLowerCase())) {
      setDraft('');
      return;
    }
    if (maxItems && value.length >= maxItems) return;
    onChange([...value, text]);
    setDraft('');
  }

  function remove(v: string) {
    onChange(value.filter((x) => x !== v));
  }

  const chipColor = accent === 'stamp' ? 'text-stamp' : 'text-ink';
  const unusedSuggestions = (suggestions || []).filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      {/* Chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {value.map((v) => (
            <span
              key={v}
              className={`inline-flex items-baseline gap-1 font-serif italic text-[15px] ${chipColor}`}
              style={{ fontVariationSettings: '"opsz" 15, "SOFT" 50' }}
            >
              {quoted ? `“${v}”` : v}
              <button
                type="button"
                onClick={() => remove(v)}
                className="font-mono text-[11px] not-italic text-ink-3 hover:text-stamp transition-colors ml-0.5"
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            }
          }}
          placeholder={placeholder}
          className="field flex-1"
        />
        <button type="button" onClick={() => commit()} className="btn-ghost">
          Add
        </button>
      </div>

      {/* Suggestions */}
      {unusedSuggestions.length > 0 && (
        <div>
          <div className="smallcaps text-[8px] text-ink-3 mb-2">Or tap to add</div>
          <div className="flex flex-wrap gap-x-2 gap-y-1.5">
            {unusedSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => commit(s)}
                className="font-serif italic text-[13px] text-ink-3 hover:text-stamp transition-colors underline decoration-rule decoration-1 underline-offset-2"
                style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
              >
                {quoted ? `“${s}”` : s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
