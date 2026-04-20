'use client';

import type { IntakeRole } from '@/lib/types';
import { ConfirmRemove } from './confirm-remove';

interface Props {
  role: IntakeRole;
  index: number;
  onChange: (patch: Partial<IntakeRole>) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function RoleCard({ role, index, onChange, onRemove, onMoveUp, onMoveDown }: Props) {
  return (
    <div className="p-5 md:p-6 border border-rule bg-paper-2/30 space-y-4">
      {/* Header */}
      <div className="flex items-baseline justify-between gap-4">
        <div className="smallcaps text-[9px] text-ink-3">
          Role № {String(index + 1).padStart(2, '0')}
        </div>
        <div className="flex items-baseline gap-3">
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              className="font-mono text-[11px] text-ink-3 hover:text-stamp transition-colors"
              aria-label="Move up"
            >
              ↑
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              className="font-mono text-[11px] text-ink-3 hover:text-stamp transition-colors"
              aria-label="Move down"
            >
              ↓
            </button>
          )}
          <ConfirmRemove onConfirm={onRemove} />
        </div>
      </div>

      {/* Title + company + dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <LabelledField label="Title">
          <input
            type="text"
            value={role.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Design Engineer"
            className="field w-full"
          />
        </LabelledField>
        <LabelledField label="Company">
          <input
            type="text"
            value={role.company}
            onChange={(e) => onChange({ company: e.target.value })}
            placeholder="Mirror Studio"
            className="field w-full"
          />
        </LabelledField>
        <LabelledField label="Start">
          <input
            type="text"
            value={role.start}
            onChange={(e) => onChange({ start: e.target.value })}
            placeholder="Jan 2024"
            className="field w-full font-mono tabular"
          />
        </LabelledField>
        <LabelledField label="End (blank = present)">
          <input
            type="text"
            value={role.end || ''}
            onChange={(e) => onChange({ end: e.target.value })}
            placeholder="Present"
            className="field w-full font-mono tabular"
          />
        </LabelledField>
      </div>

      {/* Summary */}
      <LabelledField label="In one sentence">
        <input
          type="text"
          value={role.summary}
          onChange={(e) => onChange({ summary: e.target.value })}
          placeholder="What did you do here?"
          className="field w-full"
        />
      </LabelledField>

      {/* Proudest of */}
      <LabelledField label="What you're proudest of">
        <input
          type="text"
          value={role.proudest}
          onChange={(e) => onChange({ proudest: e.target.value })}
          placeholder="A specific outcome, shipped thing, or moment."
          className="field w-full"
        />
      </LabelledField>

      {/* Stack */}
      <LabelledField label="Stack (optional)">
        <input
          type="text"
          value={role.stack || ''}
          onChange={(e) => onChange({ stack: e.target.value })}
          placeholder="React, Three.js, WebMIDI"
          className="field w-full"
        />
      </LabelledField>

      {/* Raw notes */}
      <LabelledField label="Messy notes (optional — nobody's reading these but you)">
        <textarea
          value={role.raw_notes || ''}
          onChange={(e) => onChange({ raw_notes: e.target.value })}
          rows={3}
          placeholder="Dump whatever you remember. Fragments are fine. You can tidy later."
          className="field w-full font-serif text-[14px] leading-snug resize-y"
          style={{ fontVariationSettings: '"opsz" 14, "SOFT" 30' }}
        />
      </LabelledField>
    </div>
  );
}

function LabelledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="smallcaps text-[9px] text-ink-3 mb-1.5">{label}</div>
      {children}
    </div>
  );
}
