'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  /** Optional dimmed prefix shown before the label, e.g. "01 ·" or a numeral. */
  prefix?: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  /** Controlled value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Called with the selected option's value when the user picks one. */
  onChange?: (value: string) => void;
  /** Form field name. A hidden input carries the value so FormData captures it. */
  name?: string;
  disabled?: boolean;
  /** Placeholder shown when no value is selected. */
  placeholder?: string;
  /** Adds a "none" option that maps to empty string. */
  allowEmpty?: boolean;
  emptyLabel?: string;
  fullWidth?: boolean;
  /**
   * 'field' (default) — paper bg + border + chevron, like an input.
   * 'inline' — transparent, just text + chevron. Lets colored text show through
   * for status pickers.
   */
  variant?: 'field' | 'inline';
  className?: string;
  wrapperClassName?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

/**
 * Editorial dropdown — fully custom popover (not a native <select>), so the
 * open menu matches the site's paper-square-ink aesthetic instead of the
 * OS picker. Doesn't auto-open on focus; only on explicit click or
 * Enter/Space/ArrowDown when focused.
 *
 * Keyboard:
 *   Enter / Space / ArrowDown  open the menu (when closed)
 *   ArrowUp / ArrowDown        move highlight (when open)
 *   Enter                      select the highlighted option
 *   Escape                     close without selecting
 *   Tab                        close and let focus advance
 */
export function Select({
  options,
  value,
  defaultValue,
  onChange,
  name,
  disabled = false,
  placeholder,
  allowEmpty = false,
  emptyLabel = 'none',
  fullWidth = false,
  variant = 'field',
  className = '',
  wrapperClassName = '',
  style,
  'aria-label': ariaLabel,
}: SelectProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const currentValue = isControlled ? value! : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  const fullOptions: SelectOption[] = allowEmpty
    ? [{ value: '', label: emptyLabel }, ...options]
    : options;

  const selected = fullOptions.find((o) => o.value === currentValue);
  const triggerLabel = selected
    ? selected.prefix
      ? `${selected.prefix} ${selected.label}`
      : selected.label
    : placeholder ?? '';

  // Reset highlight to selected (or 0) every time the menu opens
  useEffect(() => {
    if (!isOpen) return;
    const idx = fullOptions.findIndex((o) => o.value === currentValue);
    setHighlightIndex(idx >= 0 ? idx : 0);

    // Decide which direction to open: if there isn't room below, flip up.
    const trigger = triggerRef.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Estimate menu height: ~36px per row, capped at 280
      const estimatedHeight = Math.min(280, fullOptions.length * 36 + 8);
      setOpenUpward(spaceBelow < estimatedHeight && spaceAbove > spaceBelow);
    }

    // Close on click outside
    function handlePointerDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function commit(opt: SelectOption) {
    if (opt.disabled) return;
    if (!isControlled) setInternalValue(opt.value);
    onChange?.(opt.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function moveHighlight(dir: 1 | -1) {
    setHighlightIndex((prev) => {
      let next = prev;
      for (let i = 0; i < fullOptions.length; i++) {
        next = (next + dir + fullOptions.length) % fullOptions.length;
        if (!fullOptions[next].disabled) return next;
      }
      return prev;
    });
  }

  function handleTriggerKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    // Open
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveHighlight(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveHighlight(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = fullOptions[highlightIndex];
      if (opt) commit(opt);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  }

  return (
    <div
      ref={wrapperRef}
      className={`relative inline-block ${fullWidth ? 'w-full' : ''} ${wrapperClassName}`}
    >
      {name && <input type="hidden" name={name} value={currentValue} />}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        onKeyDown={handleTriggerKey}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        className={`
          ${variant === 'field' ? 'select-trigger-field' : 'select-trigger-inline'}
          ${fullWidth ? 'w-full' : ''}
          ${disabled ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        style={style}
      >
        <span className="select-trigger-label">{triggerLabel || ' '}</span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`select-trigger-chevron ${isOpen ? 'rotate-180' : ''} transition-transform`}
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className={`select-popover ${openUpward ? 'select-popover-up' : ''}`}
        >
          {fullOptions.map((opt, i) => {
            const isSelected = opt.value === currentValue;
            const isHighlighted = i === highlightIndex;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled || undefined}
                className={`select-option
                  ${isHighlighted ? 'select-option-highlighted' : ''}
                  ${isSelected ? 'select-option-selected' : ''}
                  ${opt.disabled ? 'select-option-disabled' : ''}
                `}
                onMouseEnter={() => setHighlightIndex(i)}
                onMouseDown={(e) => {
                  // mousedown so the click lands before the click-outside
                  // handler closes the menu via document mousedown
                  e.preventDefault();
                  commit(opt);
                }}
              >
                {opt.prefix && <span className="select-option-prefix">{opt.prefix}</span>}
                <span>{opt.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
