import { getAllCalibrations, getRecentRecommendationOverrides } from '@/lib/queries/calibrations';
import { DIMENSION_LABELS } from '@/lib/constants';
import type { Dimension } from '@/lib/types';
import { PageHeader, Section, EmptyState } from '@/components/layout/editorial';

export default function CalibrationsPage() {
  const calibrations = getAllCalibrations();
  const overrides = getRecentRecommendationOverrides(20);

  const dims: Dimension[] = ['want', 'can', 'grow', 'pay', 'team', 'impact'];
  const dimStats: Record<Dimension, { count: number; totalDelta: number }> = {} as Record<
    Dimension,
    { count: number; totalDelta: number }
  >;
  for (const d of dims) dimStats[d] = { count: 0, totalDelta: 0 };

  for (const cal of calibrations) {
    const d = cal.dimension as Dimension;
    if (dimStats[d]) {
      dimStats[d].count++;
      dimStats[d].totalDelta += cal.my_score - cal.ai_score;
    }
  }

  const patterns: string[] = [];
  for (const d of dims) {
    const stats = dimStats[d];
    if (stats.count >= 2) {
      const avg = stats.totalDelta / stats.count;
      if (avg < -0.5) {
        patterns.push(
          `You consistently score ${DIMENSION_LABELS[d]} lower than the AI (avg delta: ${avg.toFixed(1)}).`,
        );
      } else if (avg > 0.5) {
        patterns.push(
          `You consistently score ${DIMENSION_LABELS[d]} higher than the AI (avg delta: +${avg.toFixed(1)}).`,
        );
      }
    }
  }

  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="VII. Calibrations"
        title="A record of"
        tail="disagreements."
        subtitle={`${calibrations.length} score corrections, ${overrides.length} recommendation overrides. Every edit teaches the compass a little more.`}
      />

      {calibrations.length === 0 ? (
        <EmptyState
          line="No calibrations yet."
          actionLabel="Override a score on any role detail page"
          actionHref="/"
        />
      ) : (
        <div className="space-y-14">
          {/* Average delta per dimension */}
          <Section label="Average delta by dimension">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {dims.map((d) => {
                const stats = dimStats[d];
                const avg = stats.count > 0 ? stats.totalDelta / stats.count : 0;
                const cls =
                  avg > 0.3
                    ? 'text-stamp'
                    : avg < -0.3
                      ? 'text-ink-2'
                      : 'text-ink-3';
                return (
                  <div key={d} className="text-center border-t border-rule pt-3">
                    <div className="smallcaps text-[8px] text-ink-3 mb-2">
                      {DIMENSION_LABELS[d]}
                    </div>
                    <div
                      className={`font-serif tabular text-[36px] leading-none tracking-tight ${cls}`}
                      style={{ fontVariationSettings: '"opsz" 48, "SOFT" 40' }}
                    >
                      {avg > 0 ? '+' : ''}
                      {avg.toFixed(1)}
                    </div>
                    <div className="font-mono tabular text-[10px] text-ink-3 mt-2">
                      {stats.count} corr.
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Detected patterns */}
          {patterns.length > 0 && (
            <Section label="Detected patterns">
              <ul className="space-y-2">
                {patterns.map((p, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span className="font-mono tabular text-[10px] text-ink-3 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className="font-serif italic text-[16px] text-ink leading-snug"
                      style={{ fontVariationSettings: '"opsz" 16, "SOFT" 50' }}
                    >
                      {p}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* All calibrations ledger */}
          <Section label={`All corrections · ${calibrations.length}`}>
            <ol className="divide-y divide-rule-soft border-t border-b border-rule-soft">
              {calibrations.map((cal) => {
                const delta = cal.my_score - cal.ai_score;
                return (
                  <li
                    key={cal.id}
                    className="py-3 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_5rem_5rem_4rem_auto] gap-x-4 gap-y-1 items-baseline text-[13px]"
                  >
                    <span
                      className="font-serif text-ink truncate"
                      style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
                    >
                      {cal.title || `Role #${cal.role_id}`}
                    </span>
                    <span className="hidden md:inline smallcaps text-[9px] text-ink-3">
                      {cal.dimension}
                    </span>
                    <span className="hidden md:inline font-mono tabular text-[11px] text-ink-2">
                      {cal.ai_score} → {cal.my_score}
                    </span>
                    <span
                      className={`font-mono tabular text-[11px] justify-self-end md:justify-self-auto ${
                        delta > 0 ? 'text-stamp' : delta < 0 ? 'text-ink-2' : 'text-ink-3'
                      }`}
                    >
                      <span className="md:hidden smallcaps text-ink-3 mr-2">{cal.dimension}</span>
                      {delta > 0 ? '+' : ''}
                      {delta}
                    </span>
                    <span
                      className="col-span-2 md:col-span-1 font-serif italic text-ink-2 truncate max-w-md"
                      style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
                      title={cal.reason}
                    >
                      {cal.reason}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Section>

          {/* Recommendation overrides */}
          {overrides.length > 0 && (
            <Section label="Recommendation overrides">
              <ol className="divide-y divide-rule-soft border-t border-b border-rule-soft">
                {overrides.map((ovr) => (
                  <li key={ovr.id} className="py-3 text-[13px]">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span
                        className="font-serif text-ink"
                        style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
                      >
                        {ovr.title}
                      </span>
                      <span
                        className="font-serif italic text-ink-2"
                        style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
                      >
                        at {ovr.company}
                      </span>
                      <span className="font-mono tabular text-[10px] text-ink-3">—</span>
                      <span className="font-serif italic text-ink-3 line-through decoration-ink-3/50">
                        {ovr.ai_recommendation}
                      </span>
                      <span className="font-mono text-[10px] text-ink-3">→</span>
                      <span className="font-serif italic text-stamp">
                        {ovr.my_recommendation}
                      </span>
                    </div>
                    {ovr.reason && (
                      <p
                        className="mt-1.5 font-serif italic text-[12px] text-ink-2"
                        style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
                      >
                        {ovr.reason}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
