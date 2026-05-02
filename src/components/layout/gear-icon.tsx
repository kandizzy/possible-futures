import Link from 'next/link';

/**
 * Thin-line gear icon, sized to feel like editorial line-work rather than
 * an app-store affordance. Used in the sidebar masthead and mobile top bar
 * to reach Settings without putting it in the numbered nav.
 */
export function GearIcon({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/settings"
      aria-label="Settings"
      className={`inline-flex items-center justify-center text-ink-3 hover:text-stamp transition-colors ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="9" r="2.5" />
        <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" />
      </svg>
    </Link>
  );
}
