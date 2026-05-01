'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string; numeral: string };

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', numeral: 'I' },
  { href: '/evaluate', label: 'Evaluate', numeral: 'II' },
  { href: '/applications', label: 'Applications', numeral: 'III' },
  { href: '/companies', label: 'Companies', numeral: 'IV' },
  { href: '/discover', label: 'Discover', numeral: 'V' },
  { href: '/people', label: 'People', numeral: 'VI' },
  { href: '/calibrations', label: 'Calibrations', numeral: 'VII' },
  { href: '/settings', label: 'Settings', numeral: 'VIII' },
  { href: '/ledger', label: 'Ledger', numeral: 'IX' },
  { href: '/archive', label: 'Archive', numeral: 'X' },
];

export function Sidebar({ userName, revisionCount = 0 }: { userName: string; revisionCount?: number }) {
  const pathname = usePathname();

  return (
    <aside className="shrink-0 border-b md:border-b-0 md:border-r border-rule flex flex-col bg-paper md:w-72">
      {/* Masthead */}
      <div className="px-5 sm:px-8 md:px-10 pt-6 md:pt-12 pb-5 md:pb-10 md:border-b md:border-rule flex items-start justify-between md:block gap-4">
        <div>
          <div className="smallcaps text-[9px] text-ink-3 mb-2 md:mb-3">A Working Index</div>
          <div
            className="font-serif text-[32px] md:text-[42px] leading-[0.88] text-ink tracking-tight"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
          >
            Possible
            <br className="hidden md:inline" />
            <span className="md:hidden"> </span>
            <span
              className="italic text-stamp"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}
            >
              Futures.
            </span>
          </div>
          <div className="mt-2 md:mt-4 flex items-baseline gap-2 flex-wrap">
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
      </div>

      {/* Nav — catalog TOC on desktop, horizontal strip on mobile */}
      <nav className="px-5 sm:px-8 md:px-10 pb-5 md:py-10 md:flex-1">
        <div className="hidden md:block smallcaps text-[9px] text-ink-3 mb-5">Sections</div>
        <ul className="flex md:flex-col gap-x-5 gap-y-[14px] overflow-x-auto md:overflow-visible -mx-5 sm:-mx-8 md:mx-0 px-5 sm:px-8 md:px-0 pb-1 md:pb-0 scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className="group flex items-baseline gap-2 md:gap-4 transition-colors"
                >
                  <span
                    className={`hidden md:inline font-mono tabular text-[10px] w-5 shrink-0 transition-colors ${
                      isActive ? 'text-stamp' : 'text-ink-3 group-hover:text-ink-2'
                    }`}
                  >
                    {item.numeral}.
                  </span>
                  <span
                    className={`font-serif text-[15px] md:text-[19px] leading-none transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-stamp italic'
                        : 'text-ink group-hover:text-stamp'
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
                    <span
                      aria-hidden
                      className="hidden md:inline ml-auto text-stamp font-serif text-[14px] leading-none"
                    >
                      ·
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="hidden md:block mt-6 pt-5 border-t border-rule-soft">
          <Link
            href="/onboarding/1"
            className={`group flex items-baseline gap-4 transition-colors ${
              pathname.startsWith('/onboarding')
                ? 'text-stamp'
                : 'text-ink-2 hover:text-stamp'
            }`}
          >
            <span
              className={`font-serif italic text-[17px] leading-none transition-colors`}
              style={{ fontVariationSettings: '"opsz" 14, "SOFT" 50' }}
            >
              Revise
            </span>
          </Link>
        </div>
      </nav>

      {/* Colophon — desktop only. Click to see the type system reference. */}
      <div className="hidden md:block px-10 pb-10 pt-5 border-t border-rule">
        <div className="smallcaps text-[9px] text-ink-3 mb-3">Colophon</div>
        <Link
          href="/colophon"
          className="group block"
          title="Read the typography reference"
        >
          <p
            className="font-serif italic text-[12px] text-ink-2 leading-snug group-hover:text-stamp transition-colors"
            style={{ fontVariationSettings: '"opsz" 12, "SOFT" 50' }}
          >
            Set in Fraunces, Instrument
            <br />
            Sans, and JetBrains Mono.
            <br />
            Printed on warm paper.
          </p>
          <span
            className="mt-2 inline-block font-serif italic text-[11px] text-ink-3 group-hover:text-stamp transition-colors"
            style={{ fontVariationSettings: '"opsz" 11, "SOFT" 40' }}
          >
            read the notes →
          </span>
        </Link>
      </div>
    </aside>
  );
}
