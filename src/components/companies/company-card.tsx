import Link from 'next/link';
import { getAtsBoardUrl } from '@/lib/ats/board-url';
import { CompanyActionsMenu } from './company-actions-menu';
import { SeeRolesButton } from './see-roles-button';
import type { CompanyWithPipeline } from '@/lib/types';

// "Pipeline status" rows shown only when the company has true pipeline
// motion (an application submitted, an interview scheduled, an offer made,
// or one of those closed out). Companies you've only just tracked don't
// surface this strip — the card stays Discover-clean until something moves.
const STATUS_DISPLAY: {
  key: keyof CompanyWithPipeline;
  label: string;
  color: string;
  filter: string | null;
}[] = [
  { key: 'interviewing_count', label: 'Interviewing', color: 'text-violet-400', filter: 'Interviewing' },
  { key: 'offer_count', label: 'Offer', color: 'text-emerald-400', filter: 'Offer' },
  { key: 'applied_count', label: 'Applied', color: 'text-indigo-400', filter: 'Applied' },
  // "Closed" is a rollup of Rejected + Ghosted + Withdrawn — no single
  // dashboard filter exists for it, so it stays as plain text.
  { key: 'closed_count', label: 'Closed', color: 'text-ink-3', filter: null },
];

export function CompanyCard({ company }: { company: CompanyWithPipeline }) {
  const hasPipelineMotion =
    company.applied_count > 0 ||
    company.interviewing_count > 0 ||
    company.offer_count > 0 ||
    company.closed_count > 0;
  const hasUrgent = company.interviewing_count > 0 || company.offer_count > 0;
  const hasAts = Boolean(company.ats_provider && company.ats_slug);

  return (
    <article
      className={`border bg-paper p-5 flex flex-col gap-4 ${
        hasUrgent ? 'border-l-2 border-l-stamp border-t-rule border-r-rule border-b-rule' : 'border-rule'
      }`}
    >
      {/* Head: name + category, with edit · skip top-right */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href={`/?company=${encodeURIComponent(company.name)}`} className="group">
            <h3
              className="font-serif text-[22px] leading-tight text-ink tracking-[-0.01em] group-hover:text-stamp transition-colors"
              style={{ fontVariationSettings: '"opsz" 24, "SOFT" 50' }}
            >
              {company.name}
            </h3>
          </Link>
          {company.category && (
            <div className="smallcaps text-[8px] text-ink-3 mt-1">{company.category}</div>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <SourceBadge source={company.source} />
          <CompanyActionsMenu
            companyId={company.id}
            name={company.name}
            category={company.category}
            why_interested={company.why_interested}
            careers_url={company.careers_url}
            ats_provider={company.ats_provider}
            ats_slug={company.ats_slug}
          />
        </div>
      </div>

      {/* Why interested — italic body matching Discover's why_fits */}
      {company.why_interested && (
        <p
          className="font-serif italic text-[13px] text-ink-2 leading-snug"
          style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
        >
          {company.why_interested}
        </p>
      )}

      {/* Pipeline strip — extra detail that only appears when something has
          actually moved (application submitted, interview, offer, closed).
          Cards without this stay clean and Discover-shaped. */}
      {hasPipelineMotion && (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono tabular text-[11px]">
          {STATUS_DISPLAY.map(({ key, label, color, filter }) => {
            const count = company[key] as number;
            if (!count) return null;
            const content = (
              <>
                <span className={color}>{label}</span>{' '}
                <span className="text-ink">{String(count).padStart(2, '0')}</span>
              </>
            );
            if (filter) {
              return (
                <Link
                  key={key}
                  href={`/?company=${encodeURIComponent(company.name)}&status=${filter}`}
                  className="hover:opacity-70 transition-opacity"
                >
                  {content}
                </Link>
              );
            }
            return <span key={key}>{content}</span>;
          })}
          <span className="text-ink-3">{company.role_count} total</span>
        </div>
      )}

      {/* ATS line — the Discover-style "provider/slug" mono line. Only when
          ATS is configured; otherwise hidden (no "no ATS" placeholder, just
          omit the row to stay clean like Discover suggestions). */}
      {hasAts && (
        <div className="font-mono tabular text-[11px] text-ink-2">
          <a
            href={getAtsBoardUrl(company.ats_provider!, company.ats_slug!)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-3 hover:text-stamp transition-colors underline decoration-rule hover:decoration-stamp"
            title={`Open ${company.ats_provider}/${company.ats_slug}`}
          >
            {company.ats_provider}/{company.ats_slug}
          </a>
        </div>
      )}

      {/* Footer: SEE ROLES (left, prominent) · careers ↗ (right). Mirrors
          Discover SuggestionCard exactly. Skip lives top-right, far from
          this navigation row. */}
      {(hasAts || company.careers_url) && (
        <div className="flex items-center justify-between gap-3 pt-1">
          {hasAts ? (
            <SeeRolesButton companyId={company.id} companyName={company.name} />
          ) : (
            <span />
          )}
          {company.careers_url && (
            <a
              href={company.careers_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-serif italic text-[13px] text-ink-2 hover:text-stamp transition-colors ml-auto"
              style={{ fontVariationSettings: '"opsz" 13, "SOFT" 60' }}
            >
              careers ↗
            </a>
          )}
        </div>
      )}
    </article>
  );
}

function SourceBadge({ source }: { source?: string }) {
  if (!source || source === 'manual') return null;
  const label = source === 'claude_suggestion' ? 'suggested' : source;
  return (
    <span className="smallcaps text-[7px] text-ink-3 border border-rule px-1.5 py-0.5">
      {label}
    </span>
  );
}
