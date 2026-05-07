'use client';

import { useEffect, useRef } from 'react';
import { getTotalScore } from '@/lib/types';
import type { AiScores, MyScores, Dimension } from '@/lib/types';

export const RADAR_DIMS: readonly Dimension[] = ['want', 'can', 'grow', 'pay', 'team', 'impact'] as const;
export const RADAR_MAX = 3;

const DIM_LABELS: Record<Dimension, string> = {
  want: 'Want',
  can: 'Can',
  grow: 'Grow',
  pay: 'Pay',
  team: 'Team',
  impact: 'Impact',
};

export function radarPoint(
  axisIndex: number,
  score: number,
  radius: number,
  centerX: number,
  centerY: number,
): readonly [number, number] {
  const angle = -Math.PI / 2 + axisIndex * (Math.PI / 3);
  const r = (score / RADAR_MAX) * radius;
  return [centerX + r * Math.cos(angle), centerY + r * Math.sin(angle)];
}

function extractScore(scores: AiScores | MyScores, dim: Dimension): number {
  const val = scores[dim];
  if (val === undefined || val === null) return 0;
  return typeof val === 'object' ? val.score : val;
}

function radarColor(total: number): string {
  if (total >= 15) return 'var(--stamp)';
  if (total >= 12) return 'var(--ink)';
  return 'var(--ink-3)';
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

type RadarProps = {
  scores: AiScores | MyScores;
  className?: string;
  ariaLabel?: string;
};

// Compact version for dashboard rows — hex scaffold + polygon only, no labels.
// Stays static (no animation) so a page full of these doesn't visually thrash.
export function ScoreRadarMini({ scores, className, ariaLabel }: RadarProps) {
  const total = getTotalScore(scores);
  const color = radarColor(total);
  const R = 22, CX = 30, CY = 30;

  const hexPoints = RADAR_DIMS.map((_, i) => radarPoint(i, RADAR_MAX, R, CX, CY).join(',')).join(' ');
  const scorePoints = RADAR_DIMS.map((d, i) =>
    radarPoint(i, extractScore(scores, d), R, CX, CY).join(','),
  ).join(' ');

  return (
    <svg
      viewBox="0 0 60 60"
      className={className}
      role="img"
      aria-label={ariaLabel ?? `Score shape: total ${total} of 18`}
    >
      <polygon points={hexPoints} fill="none" stroke="var(--rule-soft)" strokeWidth={0.8} />
      <polygon
        points={scorePoints}
        fill={color}
        fillOpacity={0.22}
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Pacing for the radar reveal. Each vertex starts STAGGER_MS after the
// previous one (Want → Can → Grow → Pay → Team → Impact) and animates
// outward over VERTEX_DUR_MS with easeOutCubic. The short stagger relative
// to the duration means 3-4 vertices are usually moving simultaneously —
// you read the sequence (axes locking in one at a time) without losing
// the shape to a single creeping line.
//
// 120ms stagger × 5 + 500ms last-vertex duration = ~1.1s total.
const STAGGER_MS = 120;
const VERTEX_DUR_MS = 500;

// Full version for the role detail header — rings, spokes, ticks, labels,
// vertex dots. Animates the polygon and dots from center outward, one
// vertex at a time, on every mount/scores-change. prefers-reduced-motion
// snaps straight to the final state.
export function ScoreRadar({ scores, className, ariaLabel }: RadarProps) {
  const total = getTotalScore(scores);
  const color = radarColor(total);
  const R = 78, CX = 120, CY = 120;

  const polygonRef = useRef<SVGPolygonElement>(null);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function paint(progressByDim: number[]) {
      const ptsArr: string[] = [];
      RADAR_DIMS.forEach((d, i) => {
        const target = extractScore(scores, d);
        const score = target * progressByDim[i];
        const [x, y] = radarPoint(i, score, R, CX, CY);
        ptsArr.push(`${x.toFixed(2)},${y.toFixed(2)}`);
        const dot = dotRefs.current[i];
        if (dot) {
          dot.setAttribute('cx', x.toFixed(2));
          dot.setAttribute('cy', y.toFixed(2));
        }
      });
      if (polygonRef.current) polygonRef.current.setAttribute('points', ptsArr.join(' '));
    }

    if (reduced) {
      paint(RADAR_DIMS.map(() => 1));
      return;
    }

    // Start collapsed at center (progress = 0 for every vertex), then run
    // a single rAF loop that advances each vertex on its own staggered
    // timeline.
    paint(RADAR_DIMS.map(() => 0));

    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      let allDone = true;
      const progress = RADAR_DIMS.map((_, i) => {
        const localElapsed = Math.max(0, elapsed - i * STAGGER_MS);
        const t = Math.min(localElapsed / VERTEX_DUR_MS, 1);
        if (t < 1) allDone = false;
        return easeOutCubic(t);
      });
      paint(progress);
      if (!allDone) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scores]);

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

  // Initial render: degenerate polygon and all dots at center. The rAF
  // effect takes over on mount and animates outward.
  const initialPoints = RADAR_DIMS.map(() => `${CX},${CY}`).join(' ');

  return (
    <svg
      viewBox="0 0 240 240"
      className={className}
      role="img"
      aria-label={ariaLabel ?? `Score radar: total ${total} of 18`}
    >
      {/* Concentric ring hexagons at score levels 1, 2, 3 */}
      {[1, 2, 3].map((level) => {
        const points = RADAR_DIMS.map((_, i) => radarPoint(i, level, R, CX, CY).join(',')).join(' ');
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
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--rule-soft)" strokeWidth={1} />;
      })}

      {/* Tick labels 1 · 2 · 3 on the top spoke */}
      {[1, 2, 3].map((level) => {
        const [x, y] = radarPoint(0, level, R, CX, CY);
        return (
          <text
            key={level}
            x={x + 5}
            y={y + 3}
            fontFamily="var(--font-mono)"
            fontSize={8}
            fill="var(--ink-3)"
          >
            {level}
          </text>
        );
      })}

      {/* Score polygon — points mutated by the rAF animation */}
      <polygon
        ref={polygonRef}
        points={initialPoints}
        fill={color}
        fillOpacity={0.18}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Vertex dots — cx/cy mutated alongside the polygon points */}
      {RADAR_DIMS.map((d, i) => (
        <circle
          key={d}
          ref={(el) => {
            dotRefs.current[i] = el;
          }}
          cx={CX}
          cy={CY}
          r={2.8}
          fill={color}
        />
      ))}

      {/* Axis labels outside the outer ring */}
      {RADAR_DIMS.map((d, i) => {
        const [x, y] = radarPoint(i, RADAR_MAX + 0.55, R, CX, CY);
        return (
          <text
            key={d}
            x={x}
            y={y}
            textAnchor={labelAnchor(i)}
            dominantBaseline={labelBaseline(i)}
            fontFamily="var(--font-serif)"
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
  );
}
