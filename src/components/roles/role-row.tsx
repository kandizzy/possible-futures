'use client';

import Link from 'next/link';
import { getTotalScore, getScoreColor } from '@/lib/types';
import { StatusSelect } from './status-select';
import { ScoreRadarMini } from './score-radar';
import type { Role } from '@/lib/types';

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

        <div className="flex justify-end shrink-0">
          <ScoreRadarMini
            scores={role.ai_scores}
            className="w-[52px] h-[52px]"
            ariaLabel={`Score shape for ${role.company}: ${total} of 18`}
          />
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
          <div className="flex items-center gap-3 shrink-0">
            <ScoreRadarMini
              scores={role.ai_scores}
              className="w-10 h-10"
              ariaLabel={`Score shape for ${role.company}: ${total} of 18`}
            />
            <div className="flex items-baseline gap-1">
              <span
                className={`font-serif tabular text-[32px] leading-none ${scoreCls} tracking-tight`}
                style={{ fontVariationSettings: '"opsz" 40, "SOFT" 40' }}
              >
                {total}
              </span>
              <span className="font-mono text-[9px] text-ink-3">/18</span>
            </div>
          </div>
        </div>

        {/* Status strip */}
        <div className="mt-3 flex justify-end pt-3 border-t border-rule-soft">
          <StatusSelect roleId={role.id} currentStatus={role.status} />
        </div>
      </div>
    </li>
  );
}
