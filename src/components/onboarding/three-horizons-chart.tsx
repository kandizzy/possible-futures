/**
 * Three Horizons curve diagram (Bill Sharpe / IFF), drawn minimally.
 *
 *   H1 · Losing fit          — the present pattern, declining as it stops serving.
 *                              Some of it is worth conserving as it goes.
 *   H2 · Seeds of innovation — disruptive bridge work; footholds that grow into H3.
 *   H3 · Viable future       — what those footholds become; the new fit.
 *
 * Three curves. Three labels. One synthesis line below. No axis decoration,
 * no "now" markers — the rightward direction and the curve shapes do the work.
 */
export function ThreeHorizonsChart() {
  return (
    <figure className="w-full max-w-2xl">
      <svg
        viewBox="0 0 600 200"
        className="w-full h-auto"
        role="img"
        aria-label="Three horizons curves: H1 losing fit declines, H2 worth conserving peaks in the middle, H3 viable future rises into the future."
      >
        {/* H1 — Losing fit: high → low */}
        <path
          d="M 30 50 C 180 55, 280 95, 420 145 C 480 165, 530 168, 570 170"
          fill="none"
          stroke="var(--ink-3)"
          strokeWidth={1.5}
        />
        <text
          x={38}
          y={42}
          fontFamily="var(--font-instrument)"
          fontSize={12}
          fontWeight={700}
          fill="var(--ink-2)"
        >
          H1 · Losing fit
        </text>

        {/* H2 — Worth conserving: bell */}
        <path
          d="M 30 170 C 130 165, 200 50, 300 50 C 400 50, 460 120, 570 170"
          fill="none"
          stroke="var(--ink)"
          strokeWidth={2}
        />
        <text
          x={224}
          y={42}
          fontFamily="var(--font-instrument)"
          fontSize={12}
          fontWeight={700}
          fill="var(--ink)"
        >
          H2 · Seeds of innovation
        </text>

        {/* H3 — Viable future: rises late */}
        <path
          d="M 30 170 C 220 167, 360 142, 460 95 C 510 70, 545 50, 570 42"
          fill="none"
          stroke="var(--stamp)"
          strokeWidth={2}
        />
        <text
          x={448}
          y={32}
          fontFamily="var(--font-instrument)"
          fontSize={12}
          fontWeight={700}
          fill="var(--stamp)"
        >
          H3 · Viable future
        </text>
      </svg>
      <figcaption
        className="mt-3 font-serif italic text-[13px] text-ink-3 leading-snug"
        style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
      >
        What to let go of, what to conserve, and how you reach a viable future.
      </figcaption>
    </figure>
  );
}
