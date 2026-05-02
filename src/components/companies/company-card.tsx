import Link from 'next/link';
import { getAtsBoardUrl } from '@/lib/ats/board-url';
import { EditCompanyButton } from './edit-company-button';
import type { CompanyWithPipeline } from '@/lib/types';

const STATUS_DISPLAY: { key: keyof CompanyWithPipeline; label: string; color: string }[] = [
  { key: 'interviewing_count', label: 'Interviewing', color: 'text-violet-400' },
  { key: 'offer_count', label: 'Offer', color: 'text-emerald-400' },
  { key: 'applied_count', label: 'Applied', color: 'text-indigo-400' },
  { key: 'new_count', label: 'New', color: 'text-blue-400' },
  { key: 'closed_count', label: 'Closed', color: 'text-ink-3' },
];

export function CompanyCard({ company }: { company: CompanyWithPipeline }) {
  const hasUrgent = company.interviewing_count > 0 || company.offer_count > 0;

  return (
    <article
      className={`border bg-paper p-5 flex flex-col gap-3 ${
        hasUrgent ? 'border-l-2 border-l-stamp border-t-rule border-r-rule border-b-rule' : 'border-rule'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/?company=${encodeURIComponent(company.name)}`}
            className="group"
          >
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
        <div className="flex items-baseline gap-2 shrink-0">
          {company.ats_provider && company.ats_slug && (
            <span className="smallcaps text-[8px] text-archive">verified</span>
          )}
          <SourceBadge source={company.source} />
        </div>
      </div>

      {company.why_interested && (
        <p
          className="font-serif italic text-[13px] text-ink-2 leading-snug"
          style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
        >
          {company.why_interested}
        </p>
      )}

      {/* Pipeline strip */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono tabular text-[11px]">
        {STATUS_DISPLAY.map(({ key, label, color }) => {
          const count = company[key] as number;
          if (!count) return null;
          return (
            <span key={key}>
              <span className={color}>{label}</span>{' '}
              <span className="text-ink">{String(count).padStart(2, '0')}</span>
            </span>
          );
        })}
        <span className="text-ink-3">
          {company.role_count} total
        </span>
      </div>

      {/* Footer: ATS + careers + edit */}
      <div className="flex items-baseline justify-between gap-3 pt-1">
        {company.ats_provider && company.ats_slug ? (
          <a
            href={getAtsBoardUrl(company.ats_provider, company.ats_slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-ink-3 hover:text-stamp transition-colors underline decoration-rule hover:decoration-stamp"
            title={`Open ${company.ats_provider}/${company.ats_slug}`}
          >
            {company.ats_provider}/{company.ats_slug}
          </a>
        ) : (
          <span className="font-mono text-[10px] text-ink-3 italic">no ATS</span>
        )}
        <div className="flex items-baseline gap-3">
          <EditCompanyButton
            companyId={company.id}
            name={company.name}
            category={company.category}
            why_interested={company.why_interested}
            careers_url={company.careers_url}
          />
          {company.careers_url && (
            <a
              href={company.careers_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-serif italic text-[13px] text-ink hover:text-stamp transition-colors"
              style={{ fontVariationSettings: '"opsz" 13, "SOFT" 60' }}
            >
              careers →
            </a>
          )}
        </div>
      </div>
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
