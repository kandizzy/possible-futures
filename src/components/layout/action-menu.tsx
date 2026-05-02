'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  /** Visually muted; intended for things like "Skip" or "Delete." */
  destructive?: boolean;
  disabled?: boolean;
}

interface Props {
  /** What renders inside the trigger button — usually an icon. */
  trigger: ReactNode;
  /** Accessible label for the trigger button. */
  triggerLabel?: string;
  /** Extra classes for the trigger button itself. */
  triggerClassName?: string;
  items: ActionMenuItem[];
  /** Wrapper class for the outermost positioning element. */
  className?: string;
}

/**
 * Minimal popover action menu — same editorial styling as the Select
 * dropdown (paper bg, ink border, 3px shadow). Used for "kebab"-style
 * menus where a single icon button reveals 2–3 actions on click.
 *
 * Native semantics: Enter/Space opens, Escape closes, click-outside
 * closes, Tab leaves and closes. Each menu item is a real button so
 * keyboard navigation falls through to the browser's default focus order.
 */
export function ActionMenu({
  trigger,
  triggerLabel = 'Actions',
  triggerClassName = '',
  items,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={triggerLabel}
        className={`inline-flex items-center justify-center text-ink-3 hover:text-stamp transition-colors ${triggerClassName}`}
      >
        {trigger}
      </button>
      {open && (
        <ul
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+4px)] z-40 min-w-[140px] bg-paper border border-ink shadow-[3px_3px_0_var(--ink)] py-1"
        >
          {items.map((item, i) => (
            <li key={i} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`w-full text-left px-4 py-2 font-serif italic text-[13px] transition-colors disabled:opacity-50 ${
                  item.destructive
                    ? 'text-ink-2 hover:bg-stamp/10 hover:text-stamp'
                    : 'text-ink hover:bg-paper-2'
                }`}
                style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
