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

async function captureVariation(v: 1 | 2 | 3 | 4): Promise<string> {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `horizons-v${v}-`));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 800, height: 320 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/demo/horizons-draw?v=${v}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-capture-target="horizons-draw"]');
  // Let the cycle re-key once so we capture from a known phase, plus a beat
  // for fonts.
  await page.waitForTimeout(800);

  const card = page.locator('[data-capture-target="horizons-draw"]');

  const FRAME_MS = 1000 / FPS;
  const FRAME_COUNT = (CYCLE_MS / FRAME_MS) | 0;
  console.log(`v${v}: capturing ${FRAME_COUNT} frames at ${FPS}fps`);

  const startedAt = Date.now();
  for (let i = 0; i < FRAME_COUNT; i++) {
    const target = startedAt + i * FRAME_MS;
    const wait = target - Date.now();
    if (wait > 0) await page.waitForTimeout(wait);
    await card.screenshot({
      path: path.join(tmp, `frame-${String(i).padStart(4, '0')}.png`),
      omitBackground: false,
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
    execFileSync(
      'gifski',
      [
        '--fps', String(FPS),
        // Scale down to keep file size small — 480 wide is plenty for a
        // slide-deck embed and roughly halves the file size vs the
        // captured 2x retina width.
        '--width', '480',
        '--quality', '85',
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
