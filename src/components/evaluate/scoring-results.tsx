'use client';

import Link from 'next/link';
import { getScoreColor } from '@/lib/types';
import { DIMENSION_LABELS } from '@/lib/constants';
import type { ScoringResponse, Dimension, Recommendation } from '@/lib/types';
import { GapAnalysis } from '@/components/roles/gap-analysis';
import { Section } from '@/components/layout/editorial';

const REC_STYLE: Record<Recommendation, string> = {
  apply: 'text-stamp italic font-semibold',
  stretch: 'text-ink italic',
  skip: 'text-ink-3 italic line-through decoration-ink-3/50',
};

export function ScoringResults({
  scoring,
  roleId,
  versionLabels,
}: {
  scoring: ScoringResponse;
  roleId: number;
  versionLabels: Record<string, string>;
}) {
  const dims: Dimension[] = ['want', 'can', 'grow', 'pay', 'team', 'impact'];
  const scoreCls = getScoreColor(scoring.total);

  return (
    <div className="mt-14 space-y-14 pt-14 border-t border-rule">
      {/* Title + verdict */}
      <header className="rise">
        <div className="smallcaps text-[9px] text-ink-3 mb-3">Verdict delivered</div>
        <h2
          className="font-serif text-[48px] leading-[0.9] text-ink tracking-[-0.02em]"
          style={{ fontVariationSettings: '"opsz" 60, "SOFT" 50' }}
        >
          {scoring.company}
        </h2>
        <p
          className="mt-3 font-serif italic text-[20px] text-ink-2"
          style={{ fontVariationSettings: '"opsz" 20, "SOFT" 50' }}
        >
          {scoring.role_title}
        </p>
        {(scoring.location || scoring.salary_range) && (
          <p className="mt-2 font-mono tabular text-[11px] text-ink-2">
            {scoring.location}
            {scoring.location && scoring.salary_range && ' · '}
            {scoring.salary_range}
          </p>
        )}
      </header>

      {/* Score + recommendation */}
      <div className="grid grid-cols-[auto_1fr] gap-10 items-center py-8 border-y border-rule">
        <div className="text-center">
          <div className="smallcaps text-[8px] text-ink-3 mb-2">Score</div>
          <div
            className={`font-serif tabular text-[96px] leading-[0.85] ${scoreCls} tracking-tighter`}
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
          >
            {scoring.total}
          </div>
          <div className="font-mono tabular text-[10px] text-ink-3 mt-1">out of 18</div>
        </div>
        <div className="pl-10 border-l border-rule space-y-4">
          <div>
            <div className="smallcaps text-[9px] text-ink-3 mb-1">Recommendation</div>
            <div
              className={`font-serif text-[28px] leading-none ${REC_STYLE[scoring.recommendation] || ''}`}
              style={{ fontVariationSettings: '"opsz" 30, "SOFT" 60' }}
            >
              {scoring.recommendation}
            </div>
          </div>
          <div>
            <div className="smallcaps text-[9px] text-ink-3 mb-1">Resume version</div>
            <div
              className="font-serif italic text-[18px] text-ink"
              style={{ fontVariationSettings: '"opsz" 18, "SOFT" 60' }}
            >
              {versionLabels[scoring.recommended_resume_version] || scoring.recommended_resume_version}
            </div>
            <p
              className="mt-1 font-serif italic text-[13px] text-ink-2 max-w-xl"
              style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
            >
              {scoring.resume_version_rationale}
            </p>
          </div>
        </div>
      </div>

      {/* Score breakdown — six plaques */}
      <Section label="Breakdown">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {dims.map((d) => {
            const dim = scoring.scores[d];
            const s = dim.score;
            const cls = s >= 3 ? 'text-stamp' : s >= 2 ? 'text-ink' : 'text-ink-3';
            return (
              <div key={d} className="p-5 bg-paper-2/50 border border-rule-soft">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="smallcaps text-[10px] text-ink-2">
                    {DIMENSION_LABELS[d]}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    className={`font-serif tabular text-[44px] leading-none ${cls} tracking-tight`}
                    style={{ fontVariationSettings: '"opsz" 60, "SOFT" 40' }}
                  >
                    {s}
                  </span>
                  <span className="font-mono tabular text-[10px] text-ink-3">/3</span>
                </div>
                <p
                  className="font-serif italic text-[13px] text-ink-2 leading-[1.55]"
                  style={{ fontVariationSettings: '"opsz" 13, "SOFT" 30' }}
                >
                  {dim.rationale}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Signals + red flags */}
      {(scoring.signal_words_found.length > 0 || scoring.red_flags_found.length > 0) && (
        <div className="grid grid-cols-2 gap-10">
          {scoring.signal_words_found.length > 0 && (
            <Section label="Signals found">
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {scoring.signal_words_found.map((w) => (
                  <span
                    key={w}
                    className="font-serif italic text-[14px] text-ink"
                    style={{ fontVariationSettings: '"opsz" 14, "SOFT" 60' }}
                  >
                    “{w}”
                  </span>
                ))}
              </div>
            </Section>
          )}
          {scoring.red_flags_found.length > 0 && (
            <Section label="Red flags">
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {scoring.red_flags_found.map((w) => (
                  <span
                    key={w}
                    className="font-serif italic text-[14px] text-stamp line-through decoration-stamp/40"
                    style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
                  >
                    “{w}”
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Fit summary */}
      {scoring.fit_summary && (
        <Section label="Wall text">
          <div
            className="font-serif text-[16px] leading-[1.6] text-ink whitespace-pre-wrap max-w-2xl"
            style={{ fontVariationSettings: '"opsz" 18, "SOFT" 30' }}
          >
            {scoring.fit_summary}
          </div>
        </Section>
      )}

      {/* Gap analysis */}
      <GapAnalysis gaps={scoring.gap_analysis} />

      {/* Calibration notes */}
      {scoring.calibration_notes && (
        <Section label="Calibration notes">
          <p
            className="font-serif italic text-[14px] text-ink-2 leading-snug max-w-xl"
            style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
          >
            {scoring.calibration_notes}
          </p>
        </Section>
      )}

      {/* Actions */}
      <div className="flex gap-4 pt-8 border-t border-rule">
        <Link href={`/roles/${roleId}`} className="btn-stamp">
          View full entry →
        </Link>
        <Link href={`/roles/${roleId}/materials`} className="btn-ghost">
          Draft materials
        </Link>
      </div>
    </div>
  );
}
