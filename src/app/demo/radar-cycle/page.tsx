'use client';

import { useEffect, useRef, useState } from 'react';
import { RADAR_DIMS, RADAR_MAX, radarPoint } from '@/components/roles/score-radar';
import type { Dimension } from '@/lib/types';

type Frame = {
  role: string;
  recommendation: 'apply' | 'stretch' | 'skip';
  scores: Record<Dimension, number>;
  feature: { dim: Dimension; rationale: string };
};

const FRAMES: Frame[] = [
  {
    role: 'Research Scientist, Deep Space Network · NASA JPL',
    recommendation: 'apply',
    scores: { want: 3, can: 3, grow: 2, pay: 2, team: 3, impact: 3 },
    feature: {
      dim: 'impact',
      rationale:
        'Every Voyager signal, every Mars rover command passes through the DSN. Civilizational-scale infrastructure.',
    },
  },
  {
    role: 'Senior Signal Processing Engineer · SETI Institute',
    recommendation: 'apply',
    scores: { want: 3, can: 2, grow: 3, pay: 2, team: 3, impact: 3 },
    feature: {
      dim: 'impact',
      rationale:
        'The literal search for extraterrestrial intelligence. Hard to find higher-impact work.',
    },
  },
  {
    role: 'VP of Curriculum, Advanced Sciences · Starfleet Academy',
    recommendation: 'stretch',
    scores: { want: 2, can: 2, grow: 2, pay: 3, team: 2, impact: 3 },
    feature: {
      dim: 'pay',
      rationale: "Starfleet doesn't use money.",
    },
  },
  {
    role: 'Chief Science Officer · SpaceX Starship',
    recommendation: 'skip',
    scores: { want: 1, can: 3, grow: 1, pay: 3, team: 1, impact: 2 },
    feature: {
      dim: 'team',
      rationale:
        'Known for burnout culture and 80-hour weeks. Red flags in the posting language.',
    },
  },
];

const DIM_LABELS: Record<Dimension, string> = {
  want: 'Want',
  can: 'Can',
  grow: 'Grow',
  pay: 'Pay',
  team: 'Team',
  impact: 'Impact',
};

const HOLD_MS = 3000;
const MORPH_MS = 600;
const HOLD_PORTION_MS = HOLD_MS - MORPH_MS;
const CYCLE_MS = HOLD_MS * FRAMES.length;

const R = 78;
const CX = 120;
const CY = 120;

function pointsFor(scores: Record<Dimension, number>): string {
  return RADAR_DIMS.map((d, i) => radarPoint(i, scores[d], R, CX, CY).join(',')).join(' ');
}

function lerpPoints(
  from: Record<Dimension, number>,
  to: Record<Dimension, number>,
  t: number,
): string {
  return RADAR_DIMS.map((d, i) => {
    const v = from[d] + (to[d] - from[d]) * t;
    return radarPoint(i, v, R, CX, CY).join(',');
  }).join(' ');
}

export default function RadarCyclePage() {
  const [idx, setIdx] = useState(0);
  const polygonRef = useRef<SVGPolygonElement>(null);

  // Single rAF loop drives both the polygon morph and the text idx, so the
  // two are mathematically guaranteed to share one clock with one well-defined
  // modulo. SMIL's looping had a subtle hiccup at cycle 2 — the engine's
  // internal animation state didn't reset perfectly across the seam — and
  // mixing two clocks (SMIL + rAF) made it worse. With one rAF clock and a
  // pure modulo, every cycle is identical to the last.
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    let lastSlot = -1;

    const tick = () => {
      const elapsed = (performance.now() - start) % CYCLE_MS;
      const slotIdx = Math.floor(elapsed / HOLD_MS);
      const slotT = elapsed - slotIdx * HOLD_MS;
      const inMorph = slotT >= HOLD_PORTION_MS;

      const fromScores = FRAMES[slotIdx].scores;
      const toScores = FRAMES[(slotIdx + 1) % FRAMES.length].scores;
      const morphProgress = inMorph ? (slotT - HOLD_PORTION_MS) / MORPH_MS : 0;

      if (polygonRef.current) {
        polygonRef.current.setAttribute(
          'points',
          inMorph ? lerpPoints(fromScores, toScores, morphProgress) : pointsFor(fromScores),
        );
      }

      if (slotIdx !== lastSlot) {
        lastSlot = slotIdx;
        setIdx(slotIdx);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const frame = FRAMES[idx];
  const initialPoints = pointsFor(FRAMES[0].scores);

  const labelAnchor = (i: number): 'start' | 'middle' | 'end' => {
    const cos = Math.cos(-Math.PI / 2 + i * (Math.PI / 3));
    if (Math.abs(cos) < 0.25) return 'middle';
    return cos > 0 ? 'start' : 'end';
  };
  const labelBaseline = (i: number): 'middle' | 'hanging' | 'text-after-edge' => {
    const sin = Math.sin(-Math.PI / 2 + i * (Math.PI / 3));
    if (sin < -0.5) return 'text-after-edge';
    if (sin > 0.5) return 'hanging';
    return 'middle';
  };

  return (
    <div
      data-capture-target="radar-cycle"
      className="w-[960px] h-[600px] bg-paper border border-rule flex flex-col"
      style={{ margin: '0' }}
    >
      {/* Title bar */}
      <div className="px-10 pt-9 pb-5 border-b border-rule">
        <div className="smallcaps text-[10px] text-ink-3 mb-2">Jadzia Dax</div>
        <h1
          className="font-serif text-[36px] leading-none text-ink tracking-[-0.02em]"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
        >
          Possible{' '}
          <span
            className="italic text-stamp"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}
          >
            Futures
          </span>
        </h1>
      </div>

      {/* Body: chart left, score block right */}
      <div className="flex-1 grid grid-cols-[420px_1fr] gap-10 px-10 py-8">
        {/* Chart + role title */}
        <div className="flex flex-col items-center justify-center">
          <svg viewBox="0 0 240 240" className="w-[360px] h-[360px]">
            {/* Concentric rings */}
            {[1, 2, 3].map((level) => {
              const points = RADAR_DIMS.map((_, i) =>
                radarPoint(i, level, R, CX, CY).join(','),
              ).join(' ');
              return (
                <polygon
                  key={level}
                  points={points}
                  fill="none"
                  stroke={level === RADAR_MAX ? 'var(--rule)' : 'var(--rule-soft)'}
                  strokeWidth={1}
                />
              );
            })}

            {/* Spokes */}
            {RADAR_DIMS.map((_, i) => {
              const [x, y] = radarPoint(i, RADAR_MAX, R, CX, CY);
              return (
                <line
                  key={i}
                  x1={CX}
                  y1={CY}
                  x2={x}
                  y2={y}
                  stroke="var(--rule-soft)"
                  strokeWidth={1}
                />
              );
            })}

            {/* Score polygon — points attribute is mutated each rAF frame */}
            <polygon
              ref={polygonRef}
              points={initialPoints}
              fill="var(--stamp)"
              fillOpacity={0.18}
              stroke="var(--stamp)"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />

            {/* Axis labels */}
            {RADAR_DIMS.map((d, i) => {
              const [x, y] = radarPoint(i, RADAR_MAX + 0.55, R, CX, CY);
              return (
                <text
                  key={d}
                  x={x}
                  y={y}
                  textAnchor={labelAnchor(i)}
                  dominantBaseline={labelBaseline(i)}
                  fontFamily="var(--font-fraunces)"
                  fontSize={12}
                  fontStyle="italic"
                  fill="var(--ink-2)"
                  style={{ fontVariationSettings: '"opsz" 12, "SOFT" 50' }}
                >
                  {DIM_LABELS[d]}
                </text>
              );
            })}
          </svg>
          <div
            key={`role-${idx}`}
            className="mt-4 font-serif italic text-[15px] text-ink-2 text-center max-w-[380px] leading-snug fade-in"
            style={{ fontVariationSettings: '"opsz" 15, "SOFT" 50' }}
          >
            {frame.role}
          </div>
          <div className="mt-2 smallcaps text-[9px] text-stamp">{frame.recommendation}</div>
        </div>

        {/* Featured score block */}
        <div
          key={`block-${idx}`}
          className="border border-rule bg-paper-2/40 p-7 flex flex-col justify-center fade-in"
        >
          <div className="smallcaps text-[10px] text-ink-3 mb-3">{DIM_LABELS[frame.feature.dim]}</div>
          <div
            className="font-serif tabular text-[64px] leading-none tracking-tight text-stamp mb-4"
            style={{ fontVariationSettings: '"opsz" 60, "SOFT" 40' }}
          >
            {frame.scores[frame.feature.dim]}
            <span className="text-[20px] text-ink-3 ml-1">/{RADAR_MAX}</span>
          </div>
          <p
            className="font-serif italic text-[16px] text-ink leading-snug"
            style={{ fontVariationSettings: '"opsz" 16, "SOFT" 50' }}
          >
            {frame.feature.rationale}
          </p>
        </div>
      </div>

      <style>{`
        .fade-in {
          animation: fade-in 600ms ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
