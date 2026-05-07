'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { RoleStatus } from '@/lib/types';

export type FilterOption = RoleStatus | 'All' | 'Discovered';

interface Props {
  /** All filter options to render in order. */
  options: FilterOption[];
  /** Currently selected option (drives the underline + the collapsed label). */
  active: FilterOption;
  /**
   * Per-option counts. Used only to decide whether to render the
   * "Discovered" filter (it hides itself when count is 0). Counts no longer
   * appear inline next to filter names — the catalog below shows entry
   * counts already.
   */
  counts: Record<string, number>;
}

/**
 * Editorial table-of-contents-style filter row that collapses on mobile.
 *
 *   Mobile (< md): renders only the active filter + a small chevron.
 *   Tapping toggles the full list as a vertical stack underneath.
 *
 *   Desktop (>= md): always renders the full list as a horizontal flex-wrap
 *   row, the original layout. The mobile summary button is hidden.
 *
 * "Discovered" is hidden when its count is 0 unless it's the active filter,
 * preserving the previous behavior.
 */
export function StatusFilterBar({ options, active, counts }: Props) {
  const [open, setOpen] = useState(false);

  function getCount(s: FilterOption): number {
    return counts[s] ?? 0;
  }

  function shouldRender(s: FilterOption): boolean {
    if (s === 'Discovered' && getCount('Discovered') === 0 && active !== 'Discovered') return false;
    return true;
  }

  const visible = options.filter(shouldRender);

  return (
    <div className="rise" style={{ animationDelay: '80ms' }}>
      <div className="smallcaps text-[9px] text-ink-3 mb-3 flex items-baseline justify-between md:block">
        <span>Filter by status</span>
        {/* Mobile-only summary trigger — shows active filter + chevron */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="dashboard-filter-list"
          className="md:hidden inline-flex items-baseline gap-2 normal-case tracking-normal"
        >
          <span
            className="font-serif italic text-[15px] text-stamp"
            style={{ fontVariationSettings: '"opsz" 16, "SOFT" 60' }}
          >
            {active}
          </span>
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path d="M1 1l4 4 4-4" />
          </svg>
        </button>
      </div>

      <div
        id="dashboard-filter-list"
        className={`
          ${open ? 'flex' : 'hidden'} md:flex
          flex-col md:flex-row md:flex-wrap
          items-start md:items-baseline
          gap-2 md:gap-x-6 md:gap-y-2
          pb-3 border-b border-rule
        `}
      >
        {visible.map((s) => {
          const isActive = active === s;
          const accentDiscovered = s === 'Discovered' && getCount(s) > 0;
          return (
            <Link
              key={s}
              href={s === 'All' ? '/' : `/?status=${s}`}
              onClick={() => setOpen(false)}
              className="group relative"
            >
              <span
                className={`font-serif text-[16px] transition-colors ${
                  isActive
                    ? 'text-stamp italic'
                    : accentDiscovered
                      ? 'text-stamp group-hover:text-stamp-deep'
                      : 'text-ink-2 group-hover:text-ink'
                }`}
                style={{
                  fontVariationSettings: isActive ? '"opsz" 16, "SOFT" 60' : '"opsz" 16',
                }}
              >
                {s}
              </span>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-stamp hidden md:block"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
