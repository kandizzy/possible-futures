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

type RadarProps = {
  scores: AiScores | MyScores;
  className?: string;
  ariaLabel?: string;
};

// Compact version for dashboard rows — hex scaffold + polygon only, no labels.
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

// Full version for the role detail header — rings, spokes, ticks, labels, vertex dots.
export function ScoreRadar({ scores, className, ariaLabel }: RadarProps) {
  const total = getTotalScore(scores);
  const color = radarColor(total);
  const R = 78, CX = 120, CY = 120;

  const scorePoints = RADAR_DIMS.map((d, i) =>
    radarPoint(i, extractScore(scores, d), R, CX, CY).join(','),
  ).join(' ');

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

      {/* Score polygon */}
      <polygon
        points={scorePoints}
        fill={color}
        fillOpacity={0.18}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Vertex dots */}
      {RADAR_DIMS.map((d, i) => {
        const [x, y] = radarPoint(i, extractScore(scores, d), R, CX, CY);
        return <circle key={d} cx={x} cy={y} r={2.8} fill={color} />;
      })}

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
