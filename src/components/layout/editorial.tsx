import type { ReactNode } from 'react';

/**
 * Editorial masthead — roman-numeral eyebrow, display heading, optional
 * italicized tail, subtitle, right-hand action slot.
 */
export function PageHeader({
  eyebrow,
  title,
  tail,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  tail?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="rise">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 md:gap-12">
        <div className="min-w-0 flex-1">
          <div className="smallcaps text-[10px] text-ink-3 mb-3">{eyebrow}</div>
          <h1
            className="font-serif text-[42px] sm:text-[52px] md:text-[64px] leading-[0.88] text-ink tracking-[-0.025em]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
          >
            {title}
            {tail && (
              <>
                <br />
                <span
                  className="italic text-stamp"
                  style={{
                    fontVariationSettings:
                      '"opsz" 144, "SOFT" 100, "WONK" 1',
                  }}
                >
                  {tail}
                </span>
              </>
            )}
          </h1>
          {subtitle && (
            <p
              className="mt-4 md:mt-5 font-serif text-[15px] md:text-[17px] text-ink-2 leading-snug max-w-xl italic"
              style={{ fontVariationSettings: '"opsz" 18, "SOFT" 40' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0 md:mt-4">{action}</div>}
      </div>
    </header>
  );
}

/**
 * Long-form section with a sticky smallcaps left-rail label on desktop,
 * stacked label on mobile.
 */
export function Section({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="rise">
      <div className="grid grid-cols-1 md:grid-cols-[8rem_1fr] gap-3 md:gap-8">
        <div className="smallcaps text-[9px] text-ink-3 md:pt-1 md:sticky md:top-8 self-start">
          {label}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

/**
 * Bordered card block — used for settings panels and sub-plaques.
 */
export function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="p-5 md:p-6 border border-rule bg-paper-2/40">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h3
            className="font-serif text-[20px] md:text-[22px] leading-none text-ink tracking-[-0.01em]"
            style={{ fontVariationSettings: '"opsz" 24, "SOFT" 40' }}
          >
            {title}
          </h3>
          {description && (
            <p
              className="mt-2 font-serif italic text-[13px] text-ink-2 leading-snug max-w-xl"
              style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
            >
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

/** A ledger stat — big tabular serif number with smallcaps subtitle. */
export function LedgerStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        className={`font-serif tabular text-[36px] md:text-[44px] leading-none tracking-tight ${
          accent ? 'text-stamp' : 'text-ink'
        }`}
        style={{ fontVariationSettings: '"opsz" 60, "SOFT" 40' }}
      >
        {typeof value === 'number' ? String(value).padStart(2, '0') : value}
      </div>
      <div className="smallcaps text-[8px] text-ink-3 mt-2">{label}</div>
    </div>
  );
}

export function LedgerDivider() {
  return <div className="hidden sm:block h-8 md:h-10 w-px bg-rule shrink-0" />;
}

/** Labelled row inside a meta strip: "Status   _____________" */
export function MetaRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="smallcaps text-[9px] text-ink-3 w-24 md:w-28 shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

/** Three pulsing stamp-colored dots. Use inside a panel or beside text. */
export function LoadingDots() {
  return (
    <div className="flex gap-1.5" aria-hidden>
      <span
        className="h-2 w-2 rounded-full bg-stamp animate-pulse"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="h-2 w-2 rounded-full bg-stamp animate-pulse"
        style={{ animationDelay: '300ms' }}
      />
      <span
        className="h-2 w-2 rounded-full bg-stamp animate-pulse"
        style={{ animationDelay: '600ms' }}
      />
    </div>
  );
}

/** Bordered loading panel — three dots, italic message, optional caption. */
export function LoadingPanel({
  message,
  caption,
}: {
  message: string;
  caption?: string;
}) {
  return (
    <div className="p-6 md:p-8 border border-rule bg-paper-2/40">
      <div className="flex items-center gap-4">
        <LoadingDots />
        <span
          className="font-serif italic text-[17px] text-ink"
          style={{ fontVariationSettings: '"opsz" 17, "SOFT" 50' }}
        >
          {message}
        </span>
      </div>
      {caption && (
        <p className="mt-3 font-mono text-[11px] text-ink-3">{caption}</p>
      )}
    </div>
  );
}

/** Empty-state block for when a catalog / list is empty. */
export function EmptyState({
  line,
  actionLabel,
  actionHref,
}: {
  line: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="py-16 md:py-20 text-center">
      <p
        className="font-serif italic text-[18px] md:text-[20px] text-ink-2"
        style={{ fontVariationSettings: '"opsz" 20, "SOFT" 60' }}
      >
        {line}
      </p>
      {actionLabel && actionHref && (
        <a href={actionHref} className="mt-4 inline-block btn-link">
          {actionLabel} →
        </a>
      )}
    </div>
  );
}
