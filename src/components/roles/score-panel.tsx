'use client';

import { useState } from 'react';
import { ScoreRadar } from './score-radar';
import { getScoreColor } from '@/lib/types';
import type { AiScores, Dimension } from '@/lib/types';

type View = 'ai' | 'calibrated';

// The radar + the two totals beneath it. When a calibration exists, the AI
// total and the "Your calibration" line act as toggles: clicking one morphs
// the radar's solid polygon to that shape. The dashed AI baseline stays put
// as reference, so clicking the AI total settles the solid onto the dashed.
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

  const radarScores = view === 'ai' ? aiScores : effectiveScores;
  const scoreCls = getScoreColor(aiTotal);

  const ariaLabel = hasCalibration
    ? `Score radar for ${company}: showing ${
        view === 'ai' ? `AI score ${aiTotal}` : `your calibration ${calibratedTotal}`
      } of 18`
    : `Score radar for ${company}: ${aiTotal} of 18`;

  // AI total block — a button when there's a calibration to toggle to,
  // otherwise plain static markup.
  const aiTotalInner = (
    <>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-serif tabular text-[64px] leading-none ${scoreCls} tracking-tight`}
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
        >
          {aiTotal}
        </span>
        <span className="font-mono text-[12px] text-ink-3">/18</span>
      </div>
      <div className="smallcaps text-[9px] text-ink-3 mt-1">Total score</div>
    </>
  );

  return (
    <div className="flex flex-col items-center shrink-0 self-center md:self-start order-first md:order-none">
      <ScoreRadar
        scores={radarScores}
        baselineScores={hasCalibration ? aiScores : undefined}
        className="w-[240px] h-[240px]"
        ariaLabel={ariaLabel}
      />

      {hasCalibration ? (
        <button
          type="button"
          onClick={() => setView('ai')}
          aria-pressed={view === 'ai'}
          className={`mt-3 flex flex-col items-center cursor-pointer transition-opacity ${
            view === 'ai' ? '' : 'opacity-40 hover:opacity-75'
          }`}
        >
          {aiTotalInner}
        </button>
      ) : (
        <div className="mt-3 flex flex-col items-center">{aiTotalInner}</div>
      )}

      {hasCalibration && (
        <button
          type="button"
          onClick={() => setView('calibrated')}
          aria-pressed={view === 'calibrated'}
          className={`mt-3 font-serif italic text-[13px] text-ink-2 cursor-pointer transition-opacity ${
            view === 'calibrated' ? '' : 'opacity-40 hover:opacity-75'
          }`}
          style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
        >
          Your calibration:{' '}
          <span className="not-italic font-mono tabular text-ink">{calibratedTotal}</span>
        </button>
      )}
    </div>
  );
}
