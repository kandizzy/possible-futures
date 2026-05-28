'use client';

import { useState } from 'react';
import { ScoreRadar } from './score-radar';
import { getScoreColor } from '@/lib/types';
import type { AiScores, Dimension } from '@/lib/types';

type View = 'ai' | 'calibrated';

// Single number block that shows the active total. When a calibration
// exists, the block becomes a toggle — click to flip between AI and
// calibrated views. A small asterisk after the number signals that
// there's another view available; the dashed baseline on the radar shows
// the inactive view (whichever one isn't currently displayed).
export function ScorePanel({
  company,
  aiScores,
  effectiveScores,
  aiTotal,
  calibratedTotal,
}: {
  company: string;
  aiScores: AiScores;
  effectiveScores: Record<Dimension, number>;
  aiTotal: number;
  calibratedTotal: number | null;
}) {
  const hasCalibration = calibratedTotal !== null && calibratedTotal !== aiTotal;
  const [view, setView] = useState<View>(hasCalibration ? 'calibrated' : 'ai');

  const activeTotal = view === 'ai' ? aiTotal : (calibratedTotal ?? aiTotal);
  const radarScores = view === 'ai' ? aiScores : effectiveScores;
  // Dashed baseline shows the other (inactive) view.
  const baseline = hasCalibration
    ? view === 'ai'
      ? effectiveScores
      : aiScores
    : undefined;
  const scoreCls = getScoreColor(activeTotal);

  // Label changes with the view so it's clear which version you're looking
  // at — "baseline" for the AI's original scoring, "calibrated" for your
  // corrections. With no calibration there's no toggle and it stays "total".
  const label = !hasCalibration
    ? 'Total score'
    : view === 'ai'
      ? 'Baseline score'
      : 'Calibrated score';

  const ariaLabel = hasCalibration
    ? `Score radar for ${company}: showing ${
        view === 'ai' ? `baseline score ${aiTotal}` : `calibrated score ${calibratedTotal}`
      } of 18 — click to toggle`
    : `Score radar for ${company}: ${aiTotal} of 18`;

  const toggle = () =>
    setView((v) => (v === 'ai' ? 'calibrated' : 'ai'));

  const numberBlock = (
    <>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-serif tabular text-[64px] leading-none ${scoreCls} tracking-tight`}
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
        >
          {activeTotal}
        </span>
        {hasCalibration && (
          // Footnote-style asterisk — signals "this score has a calibrated
          // counterpart; click the block to see it." Sits at the cap height
          // of the big number via self-start.
          <span
            aria-hidden="true"
            className="font-serif text-[26px] leading-none text-stamp self-start mt-1"
            style={{ fontVariationSettings: '"opsz" 26, "SOFT" 40' }}
          >
            *
          </span>
        )}
        <span className="font-mono text-[12px] text-ink-3">/18</span>
      </div>
      <div className="smallcaps text-[9px] text-ink-3 mt-1">{label}</div>
    </>
  );

  return (
    <div className="flex flex-col items-center shrink-0 self-center md:self-start order-first md:order-none">
      <ScoreRadar
        scores={radarScores}
        baselineScores={baseline}
        className="w-[240px] h-[240px]"
        ariaLabel={ariaLabel}
      />
      {hasCalibration ? (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={view === 'calibrated'}
          aria-label={
            view === 'calibrated'
              ? `Calibrated score: ${activeTotal} of 18. Click to see baseline.`
              : `Baseline score: ${activeTotal} of 18. Click to see your calibration.`
          }
          title={
            view === 'calibrated'
              ? 'Calibrated score — click to see baseline'
              : 'Baseline score — click to see calibrated'
          }
          className="mt-3 flex flex-col items-center cursor-pointer transition-opacity hover:opacity-80"
        >
          {numberBlock}
        </button>
      ) : (
        <div className="mt-3 flex flex-col items-center">{numberBlock}</div>
      )}
    </div>
  );
}
