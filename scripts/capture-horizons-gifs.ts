/**
 * Capture three Three Horizons animation variations as small GIFs for the
 * slide deck. Each variation lives at /demo/horizons-draw?v=N and re-keys
 * its animation every 6 seconds.
 *
 * Prerequisites:
 *   - dev server running:  npm run dev
 *   - gifski installed:    brew install gifski
 *
 * Run:
 *   npx tsx scripts/capture-horizons-gifs.ts
 *
 * Outputs:
 *   docs/screenshots/horizons-draw-v1.gif
 *   docs/screenshots/horizons-draw-v2.gif
 *   docs/screenshots/horizons-draw-v3.gif
 */

import { chromium } from 'playwright';
import { execFileSync, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CYCLE_MS = 6000;
const FPS = 15; // 15 fps × 6s = 90 frames; cycle divides cleanly

function hasBin(name: string): boolean {
  try {
    execSync(`command -v ${name}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

interface VariantConfig {
  /** How long to capture per cycle, ms. */
  durationMs: number;
  /** Loops? -1 = play once and stop. 0 = infinite. */
  repeat: number;
  /** Wait before capture begins (font settle, animation start sync). */
  preWaitMs: number;
}

const VARIANT_CONFIG: Record<1 | 2 | 3 | 4, VariantConfig> = {
  // 1, 2, 3 keep their previous looping behavior (mostly used for exploration)
  1: { durationMs: CYCLE_MS, repeat: 0, preWaitMs: 800 },
  2: { durationMs: CYCLE_MS, repeat: 0, preWaitMs: 800 },
  3: { durationMs: CYCLE_MS, repeat: 0, preWaitMs: 800 },
  // v4 is the slide-deck variant — plays once and freezes on the completed
  // diagram. 3500ms covers the 2900ms draw + ~500ms breathing on the
  // finished state.
  4: { durationMs: 3500, repeat: -1, preWaitMs: 200 },
};

async function captureVariation(v: 1 | 2 | 3 | 4): Promise<string> {
  const cfg = VARIANT_CONFIG[v];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `horizons-v${v}-`));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 800, height: 320 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  // Override page background to transparent so element.screenshot with
  // omitBackground produces a truly transparent PNG instead of capturing
  // the body's paper bg. Lets the GIF blend into any host page seamlessly.
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = 'html, body { background: transparent !important; }';
    document.documentElement.appendChild(style);
  });

  await page.goto(`${BASE}/demo/horizons-draw?v=${v}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-capture-target="horizons-draw"]');
  // Wait for Google Fonts to fully resolve before any frame capture.
  // networkidle alone isn't enough for variable fonts like Fraunces.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(cfg.preWaitMs);

  const card = page.locator('[data-capture-target="horizons-draw"]');

  const FRAME_MS = 1000 / FPS;
  const FRAME_COUNT = (cfg.durationMs / FRAME_MS) | 0;
  console.log(`v${v}: capturing ${FRAME_COUNT} frames at ${FPS}fps`);

  const startedAt = Date.now();
  for (let i = 0; i < FRAME_COUNT; i++) {
    const target = startedAt + i * FRAME_MS;
    const wait = target - Date.now();
    if (wait > 0) await page.waitForTimeout(wait);
    await card.screenshot({
      path: path.join(tmp, `frame-${String(i).padStart(4, '0')}.png`),
      omitBackground: true,
    });
  }
  await browser.close();

  const out = path.join(process.cwd(), 'docs', 'screenshots', `horizons-draw-v${v}.gif`);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const frames = fs
    .readdirSync(tmp)
    .filter((f) => f.endsWith('.png'))
    .sort()
    .map((f) => path.join(tmp, f));

  if (hasBin('gifski')) {
    // --matte: semi-transparent pixels (curve antialiased edges, anything
    // less than fully opaque) get composited against the paper color before
    // quantization. Without it, gifski dithers them to alternating
    // transparent/opaque pixels and produces a visible checkerboard texture
    // in the output GIF. Paper hex matches --paper in globals.css.
    execFileSync(
      'gifski',
      [
        '--fps', String(FPS),
        '--width', '480',
        '--quality', '90',
        '--matte', 'f4eee4',
        '--repeat', String(cfg.repeat),
        '--output', out,
        ...frames,
      ],
      { stdio: 'inherit' },
    );
  } else {
    throw new Error('gifski not found. Install: brew install gifski');
  }

  fs.rmSync(tmp, { recursive: true, force: true });
  const stat = fs.statSync(out);
  console.log(`✓ ${out} (${(stat.size / 1024).toFixed(0)} KB)\n`);
  return out;
}

async function main() {
  // CLI arg picks which to capture. No args → all of them.
  const arg = process.argv[2];
  const versions: (1 | 2 | 3 | 4)[] = arg
    ? [Number(arg) as 1 | 2 | 3 | 4]
    : [1, 2, 3, 4];
  for (const v of versions) {
    await captureVariation(v);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
