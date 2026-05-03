'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Three Horizons curves — animated GIF source surface. Three variations,
 * selected via ?v=1|2|3, each captured by scripts/capture-horizons-gifs.ts.
 *
 *   v=1  Sequential narrative — curves draw one at a time, labels fade in
 *        after each, synthesis caption appears last. Loop after a hold.
 *   v=2  Slow continuous reveal — all three curves draw simultaneously,
 *        labels visible from start in low contrast.
 *   v=3  Pure line work — curves draw sequentially with NO labels, just a
 *        small "Possible Futures." mark below. Most minimal/editorial.
 *
 * The animation runs on a fixed cycle (CYCLE_MS ms) by re-keying the SVG
 * each cycle so CSS animations restart cleanly. Capture script samples this
 * window with frame-perfect alignment.
 */

const CYCLE_MS = 6000;

// Path data shared across variations
const H1_PATH = 'M 30 60 C 180 65, 280 105, 420 155 C 480 175, 530 178, 570 180';
const H2_PATH = 'M 30 180 C 130 175, 200 60, 300 60 C 400 60, 460 130, 570 180';
const H3_PATH = 'M 30 180 C 220 177, 360 152, 460 105 C 510 80, 545 60, 570 52';
const PATH_LEN = 800; // overestimate so dasharray fully covers each curve

const VIEW_W = 600;
const VIEW_H = 220;

export default function HorizonsDrawPage() {
  const params = useSearchParams();
  const v = params.get('v') ?? '1';
  const [tick, setTick] = useState(0);

  // Re-key the SVG every CYCLE_MS so CSS animations restart cleanly.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-8">
      <figure data-capture-target="horizons-draw" className="bg-paper p-6">
        {v === '1' && <Variation1 key={tick} />}
        {v === '2' && <Variation2 key={tick} />}
        {v === '3' && <Variation3 key={tick} />}
        {v === '4' && <Variation4 key={tick} />}
      </figure>
    </div>
  );
}

// -- Variation 1: Sequential narrative draw -------------------------------
function Variation1() {
  return (
    <div className="w-[640px]">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto">
        <defs>
          <style>{`
            .v1-h1 { stroke-dasharray: ${PATH_LEN}; stroke-dashoffset: ${PATH_LEN}; animation: draw1 1100ms ease-out 0ms forwards; }
            .v1-h2 { stroke-dasharray: ${PATH_LEN}; stroke-dashoffset: ${PATH_LEN}; animation: draw1 1100ms ease-out 1300ms forwards; }
            .v1-h3 { stroke-dasharray: ${PATH_LEN}; stroke-dashoffset: ${PATH_LEN}; animation: draw1 1100ms ease-out 2600ms forwards; }
            .v1-l1 { opacity: 0; animation: fadein 500ms ease-out 1100ms forwards; }
            .v1-l2 { opacity: 0; animation: fadein 500ms ease-out 2400ms forwards; }
            .v1-l3 { opacity: 0; animation: fadein 500ms ease-out 3700ms forwards; }
            @keyframes draw1 { to { stroke-dashoffset: 0; } }
            @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
          `}</style>
        </defs>
        <path d={H1_PATH} fill="none" stroke="var(--ink-3)" strokeWidth={1.5} className="v1-h1" />
        <path d={H2_PATH} fill="none" stroke="var(--ink)" strokeWidth={2} className="v1-h2" />
        <path d={H3_PATH} fill="none" stroke="var(--stamp)" strokeWidth={2} className="v1-h3" />
        <text x={38} y={50} fontFamily="var(--font-instrument)" fontSize={12} fontWeight={700} fill="var(--ink-2)" className="v1-l1">
          H1 · Losing fit
        </text>
        <text x={224} y={50} fontFamily="var(--font-instrument)" fontSize={12} fontWeight={700} fill="var(--ink)" className="v1-l2">
          H2 · Seeds of innovation
        </text>
        <text x={448} y={42} fontFamily="var(--font-instrument)" fontSize={12} fontWeight={700} fill="var(--stamp)" className="v1-l3">
          H3 · Viable future
        </text>
      </svg>
    </div>
  );
}

// -- Variation 2: Slow simultaneous reveal --------------------------------
function Variation2() {
  return (
    <div className="w-[640px]">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto">
        <defs>
          <style>{`
            .v2-path { stroke-dasharray: ${PATH_LEN}; stroke-dashoffset: ${PATH_LEN}; animation: draw2 2400ms ease-out forwards; }
            .v2-label { opacity: 0.4; }
            @keyframes draw2 { to { stroke-dashoffset: 0; } }
          `}</style>
        </defs>
        <path d={H1_PATH} fill="none" stroke="var(--ink-3)" strokeWidth={1.5} className="v2-path" />
        <path d={H2_PATH} fill="none" stroke="var(--ink)" strokeWidth={2} className="v2-path" />
        <path d={H3_PATH} fill="none" stroke="var(--stamp)" strokeWidth={2} className="v2-path" />
        <text x={38} y={50} fontFamily="var(--font-instrument)" fontSize={12} fontWeight={700} fill="var(--ink-2)" className="v2-label">
          H1 · Losing fit
        </text>
        <text x={224} y={50} fontFamily="var(--font-instrument)" fontSize={12} fontWeight={700} fill="var(--ink)" className="v2-label">
          H2 · Seeds of innovation
        </text>
        <text x={448} y={42} fontFamily="var(--font-instrument)" fontSize={12} fontWeight={700} fill="var(--stamp)" className="v2-label">
          H3 · Viable future
        </text>
      </svg>
    </div>
  );
}

// -- Variation 4: JUST the lines — no text at all -------------------------
// Designed for the slide deck title page, where the "Possible Futures."
// wordmark is already huge above. The animation is purely the three curves
// drawing in sequence, breathing life under a static title.
function Variation4() {
  return (
    <div className="w-[640px]">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto">
        <defs>
          <style>{`
            .v4-h1 { stroke-dasharray: ${PATH_LEN}; stroke-dashoffset: ${PATH_LEN}; animation: drawv4 1500ms ease-out 0ms forwards; }
            .v4-h2 { stroke-dasharray: ${PATH_LEN}; stroke-dashoffset: ${PATH_LEN}; animation: drawv4 1500ms ease-out 700ms forwards; }
            .v4-h3 { stroke-dasharray: ${PATH_LEN}; stroke-dashoffset: ${PATH_LEN}; animation: drawv4 1500ms ease-out 1400ms forwards; }
            @keyframes drawv4 { to { stroke-dashoffset: 0; } }
          `}</style>
        </defs>
        <path d={H1_PATH} fill="none" stroke="var(--ink-3)" strokeWidth={1.5} className="v4-h1" />
        <path d={H2_PATH} fill="none" stroke="var(--ink)" strokeWidth={2} className="v4-h2" />
        <path d={H3_PATH} fill="none" stroke="var(--stamp)" strokeWidth={2} className="v4-h3" />
      </svg>
    </div>
  );
}

// -- Variation 3: Pure line work, minimal mark below ----------------------
function Variation3() {
  return (
    <div className="w-[640px]">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto">
        <defs>
          <style>{`
            .v3-h1 { stroke-dasharray: ${PATH_LEN}; stroke-dashoffset: ${PATH_LEN}; animation: drawv3 1400ms ease-out 0ms forwards; }
            .v3-h2 { stroke-dasharray: ${PATH_LEN}; stroke-dashoffset: ${PATH_LEN}; animation: drawv3 1400ms ease-out 600ms forwards; }
            .v3-h3 { stroke-dasharray: ${PATH_LEN}; stroke-dashoffset: ${PATH_LEN}; animation: drawv3 1400ms ease-out 1200ms forwards; }
            @keyframes drawv3 { to { stroke-dashoffset: 0; } }
          `}</style>
        </defs>
        <path d={H1_PATH} fill="none" stroke="var(--ink-3)" strokeWidth={1.5} className="v3-h1" />
        <path d={H2_PATH} fill="none" stroke="var(--ink)" strokeWidth={2} className="v3-h2" />
        <path d={H3_PATH} fill="none" stroke="var(--stamp)" strokeWidth={2} className="v3-h3" />
      </svg>
      <p
        className="mt-3 font-serif text-[18px] text-ink text-center tracking-[-0.01em]"
        style={{ fontVariationSettings: '"opsz" 24, "SOFT" 50' }}
      >
        Possible{' '}
        <span
          className="italic text-stamp"
          style={{ fontVariationSettings: '"opsz" 24, "SOFT" 100, "WONK" 1' }}
        >
          Futures.
        </span>
      </p>
    </div>
  );
}
