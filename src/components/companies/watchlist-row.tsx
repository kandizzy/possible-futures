import { AtsIndicator } from '@/components/discovery/ats-indicator';
import { EditCompanyButton } from './edit-company-button';
import type { CompanyWithPipeline } from '@/lib/types';

export function WatchlistRow({ company }: { company: CompanyWithPipeline }) {
  return (
    <li className="py-3 px-1 hover:bg-paper-2/30 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="font-serif text-[17px] leading-tight text-ink tracking-[-0.01em]"
              style={{ fontVariationSettings: '"opsz" 18, "SOFT" 40' }}
            >
              {company.name}
            </span>
            {company.source === 'claude_suggestion' && (
              <span className="smallcaps text-[7px] text-ink-3 border border-rule px-1.5 py-0.5">
                suggested
              </span>
            )}
            {company.source === 'seed' && (
              <span className="smallcaps text-[7px] text-ink-3 border border-rule px-1.5 py-0.5">
                seed
              </span>
            )}
          </div>
          {company.why_interested && (
            <p
              className="mt-0.5 font-serif italic text-[12px] text-ink-3 leading-snug truncate"
              style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
            >
              {company.why_interested}
            </p>
          )}
        </div>
        <div className="flex items-baseline gap-4 shrink-0">
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
              className="font-serif italic text-[12px] text-ink-2 hover:text-stamp transition-colors"
              style={{ fontVariationSettings: '"opsz" 12, "SOFT" 60' }}
            >
              careers →
            </a>
          )}
        </div>
      </div>
      <div className="mt-1.5">
        <AtsIndicator
          companyId={company.id}
          careersUrl={company.careers_url}
          atsProvider={company.ats_provider}
          atsSlug={company.ats_slug}
          lastScannedAt={company.last_scanned_at}
        />
      </div>
    </li>
  );
}
