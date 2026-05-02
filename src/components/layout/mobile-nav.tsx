'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from './nav-items';
import { GearIcon } from './gear-icon';

export function MobileNav({
  userName,
  revisionCount = 0,
}: {
  userName: string;
  revisionCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Native dialog "close" event fires for ESC and backdrop close — sync state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => setOpen(false);
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, []);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) setOpen(false);
  }

  return (
    <>
      {/* Sticky compact top bar — visible only below md */}
      <header className="md:hidden sticky top-0 z-40 bg-paper border-b border-rule flex items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-baseline gap-2 leading-none">
          <span
            className="font-serif text-[20px] text-ink leading-none"
            style={{ fontVariationSettings: '"opsz" 24, "SOFT" 50' }}
          >
            Possible
          </span>
          <span
            className="font-serif italic text-[20px] text-stamp leading-none"
            style={{ fontVariationSettings: '"opsz" 24, "SOFT" 100, "WONK" 1' }}
          >
            Futures.
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <GearIcon />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="-mr-2 p-2 text-ink hover:text-stamp transition-colors"
          >
            <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true">
              <line x1="0" y1="1" x2="22" y2="1" stroke="currentColor" strokeWidth="1.5" />
              <line x1="0" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="1.5" />
              <line x1="0" y1="13" x2="22" y2="13" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </header>

      {/* Drawer — slides in from the right via CSS animation when [open] */}
      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        className="md:hidden bg-transparent backdrop:bg-ink/40 backdrop:backdrop-blur-[1px] p-0 m-0 fixed inset-0 max-w-none w-screen h-screen max-h-screen"
      >
        <div className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-paper border-l border-ink shadow-[-4px_0_0_var(--ink)] flex flex-col">
          {/* Drawer head — close button */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-rule">
            <span className="smallcaps text-[9px] text-ink-3">Navigate</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-serif italic text-[14px] text-ink-2 hover:text-stamp transition-colors"
              style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
              aria-label="Close navigation"
            >
              close ×
            </button>
          </div>

          {/* Masthead */}
          <div className="px-6 pt-7 pb-6 border-b border-rule">
            <div className="smallcaps text-[9px] text-ink-3 mb-3">A Working Index</div>
            <div
              className="font-serif text-[36px] leading-[0.88] text-ink tracking-tight"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
            >
              Possible
              <br />
              <span
                className="italic text-stamp"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}
              >
                Futures.
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2 flex-wrap">
              <span className="font-mono tabular text-[10px] text-ink-2">
                {new Date().getFullYear()}
              </span>
              {revisionCount > 0 && (
                <>
                  <span className="text-ink-3">·</span>
                  <span className="font-mono tabular text-[10px] text-ink-3">
                    Rev. {revisionCount}
                  </span>
                </>
              )}
              <span className="text-ink-3">·</span>
              <span
                className="font-serif italic text-[12px] text-ink-2"
                style={{ fontVariationSettings: '"opsz" 14' }}
              >
                {userName}
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-6 py-7">
            <div className="smallcaps text-[9px] text-ink-3 mb-5">Sections</div>
            <ul className="flex flex-col gap-y-4">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex items-baseline gap-4 transition-colors"
                    >
                      <span
                        className={`font-mono tabular text-[10px] w-5 shrink-0 transition-colors ${
                          isActive ? 'text-stamp' : 'text-ink-3 group-hover:text-ink-2'
                        }`}
                      >
                        {item.numeral}.
                      </span>
                      <span
                        className={`font-serif text-[19px] leading-none transition-colors ${
                          isActive ? 'text-stamp italic' : 'text-ink group-hover:text-stamp'
                        }`}
                        style={{
                          fontVariationSettings: isActive
                            ? '"opsz" 14, "SOFT" 50'
                            : '"opsz" 14, "SOFT" 20',
                        }}
                      >
                        {item.label}
                      </span>
                      {isActive && (
                        <span className="font-serif italic text-[11px] text-stamp ml-1">
                          ·
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </dialog>
    </>
  );
}
