'use client';

import Link from 'next/link';
import { getTotalScore, getScoreColor } from '@/lib/types';
import { StatusSelect } from './status-select';
import type { Role } from '@/lib/types';

const DIM_LABELS: { key: 'want' | 'can' | 'grow' | 'pay' | 'team' | 'impact'; label: string }[] = [
  { key: 'want', label: 'W' },
  { key: 'can', label: 'C' },
  { key: 'grow', label: 'G' },
  { key: 'pay', label: 'P' },
  { key: 'team', label: 'T' },
  { key: 'impact', label: 'I' },
];

export function RoleRow({
  role,
  index,
  versionLabels,
}: {
  role: Role;
  index: number;
  versionLabels: Record<string, string>;
}) {
  const total = getTotalScore(role.ai_scores);
  const scoreCls = getScoreColor(total);
  const versionLabel = role.recommended_resume_version
    ? versionLabels[role.recommended_resume_version] || role.recommended_resume_version
    : null;

  return (
    <li className="catalog-row py-5 md:py-6 px-1 hover:bg-paper-2/60 transition-colors">
      {/* Desktop layout — 5-col grid */}
      <div className="hidden md:grid grid-cols-[2.5rem_1fr_auto_auto_auto] items-center gap-x-8">
        <span className="font-mono tabular text-[10px] text-ink-3 self-start pt-2">
          {String(index).padStart(2, '0')}
        </span>

        <Link href={`/roles/${role.id}`} className="min-w-0 block group">
          <div
            className="font-serif text-[22px] leading-[1.05] text-ink group-hover:text-stamp transition-colors tracking-[-0.01em] truncate"
            style={{ fontVariationSettings: '"opsz" 30, "SOFT" 30' }}
          >
            {role.company}
          </div>
          <div className="mt-1 text-[13px] text-ink-2 leading-snug truncate">
            {role.title}
            {role.location && (
              <>
                <span className="text-ink-3 mx-1.5">·</span>
                <span className="text-ink-2">{role.location}</span>
              </>
            )}
            {role.salary_range && (
              <>
                <span className="text-ink-3 mx-1.5">·</span>
                <span className="font-mono tabular text-[11px] text-ink-2">
                  {role.salary_range}
                </span>
              </>
            )}
          </div>
          {versionLabel && (
            <div className="mt-1.5 smallcaps text-[8px] text-ink-3">
              Resume: {versionLabel}
            </div>
          )}
        </Link>

        <div className="flex items-baseline gap-2.5 font-mono tabular text-[10px] text-ink-2 px-4 border-l border-r border-rule-soft mx-2">
          {DIM_LABELS.map(({ key, label }) => {
            const s = role.ai_scores[key].score;
            return (
              <span key={key} className="inline-flex flex-col items-center leading-none gap-0.5">
                <span className="text-ink-3 text-[8px]">{label}</span>
                <span
                  className={
                    s >= 3 ? 'text-stamp font-semibold' : s >= 2 ? 'text-ink' : 'text-ink-3'
                  }
                >
                  {s}
                </span>
              </span>
            );
          })}
        </div>

        <div className="flex items-baseline gap-1">
          <span
            className={`font-serif tabular text-[38px] leading-none ${scoreCls} tracking-tight`}
            style={{ fontVariationSettings: '"opsz" 48, "SOFT" 40' }}
          >
            {total}
          </span>
          <span className="font-mono text-[9px] text-ink-3">/18</span>
        </div>

        <div className="min-w-[7rem] flex justify-end">
          <StatusSelect roleId={role.id} currentStatus={role.status} />
        </div>
      </div>

      {/* Mobile layout — stacked */}
      <div className="md:hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="font-mono tabular text-[9px] text-ink-3">
                {String(index).padStart(2, '0')}
              </span>
            </div>
            <Link href={`/roles/${role.id}`} className="block group">
              <div
                className="font-serif text-[20px] leading-[1.05] text-ink group-hover:text-stamp transition-colors tracking-[-0.01em]"
                style={{ fontVariationSettings: '"opsz" 24, "SOFT" 30' }}
              >
                {role.company}
              </div>
              <div className="mt-1 text-[13px] text-ink-2 leading-snug">
                {role.title}
              </div>
              {(role.location || role.salary_range) && (
                <div className="mt-1 text-[11px] text-ink-3 flex flex-wrap gap-x-2">
                  {role.location && <span>{role.location}</span>}
                  {role.salary_range && (
                    <span className="font-mono tabular">{role.salary_range}</span>
                  )}
                </div>
              )}
            </Link>
          </div>
          <div className="flex items-baseline gap-1 shrink-0">
            <span
              className={`font-serif tabular text-[32px] leading-none ${scoreCls} tracking-tight`}
              style={{ fontVariationSettings: '"opsz" 40, "SOFT" 40' }}
            >
              {total}
            </span>
            <span className="font-mono text-[9px] text-ink-3">/18</span>
          </div>
        </div>

        {/* Dimension row + status */}
        <div className="mt-3 flex items-baseline justify-between gap-4 pt-3 border-t border-rule-soft">
          <div className="flex items-baseline gap-2.5 font-mono tabular text-[10px] text-ink-2">
            {DIM_LABELS.map(({ key, label }) => {
              const s = role.ai_scores[key].score;
              return (
                <span
                  key={key}
                  className="inline-flex flex-col items-center leading-none gap-0.5"
                >
                  <span className="text-ink-3 text-[8px]">{label}</span>
                  <span
                    className={
                      s >= 3 ? 'text-stamp font-semibold' : s >= 2 ? 'text-ink' : 'text-ink-3'
                    }
                  >
                    {s}
                  </span>
                </span>
              );
            })}
          </div>
          <StatusSelect roleId={role.id} currentStatus={role.status} />
        </div>
      </div>
    </li>
  );
}
