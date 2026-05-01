/**
 * Capture the /demo/radar-cycle page as an animated GIF.
 *
 * Prerequisites:
 *   - dev server running:  npm run dev
 *   - gifski installed:    brew install gifski
 *
 * Run:
 *   npx tsx scripts/capture-radar-gif.ts
 *
 * Output:
 *   docs/screenshots/radar-cycle.gif
 */

import { chromium } from 'playwright';
import { execFileSync, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

function hasBin(name: string): boolean {
  try {
    execSync(`command -v ${name}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const URL = `${BASE}/demo/radar-cycle`;
const OUT = path.join(process.cwd(), 'docs', 'screenshots', 'radar-cycle.gif');

// Animation cycle: 4 roles × 3000ms hold = 12000ms. Must match HOLD_MS in
// src/app/demo/radar-cycle/page.tsx so the loop closes seamlessly.
//
// FPS chosen so FRAME_COUNT × FRAME_MS === CYCLE_MS exactly. Otherwise the
// GIF playback duration drifts from the source animation cycle and the loop
// seam visibly hiccups.
const CYCLE_MS = 4 * 3000;
const FPS = 20;
const FRAME_MS = 1000 / FPS;
const FRAME_COUNT = CYCLE_MS / FRAME_MS;
if (!Number.isInteger(FRAME_COUNT)) {
  throw new Error(`FPS ${FPS} doesn't divide CYCLE_MS ${CYCLE_MS} cleanly`);
}

async function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'radar-cycle-'));
  console.log(`Frames → ${tmp}`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1000, height: 660 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-capture-target="radar-cycle"]');
  // Give fonts a beat to settle.
  await page.waitForTimeout(800);

  const card = page.locator('[data-capture-target="radar-cycle"]');

  console.log(`Capturing ${FRAME_COUNT} frames at ${FPS}fps over ${CYCLE_MS}ms…`);
  const startedAt = Date.now();
  for (let i = 0; i < FRAME_COUNT; i++) {
    const target = startedAt + i * FRAME_MS;
    const wait = target - Date.now();
    if (wait > 0) await page.waitForTimeout(wait);
    const frameFile = path.join(tmp, `frame-${String(i).padStart(4, '0')}.png`);
    await card.screenshot({ path: frameFile, omitBackground: false });
  }

  await browser.close();

  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  const frames = fs
    .readdirSync(tmp)
    .filter((f) => f.endsWith('.png'))
    .sort()
    .map((f) => path.join(tmp, f));

  console.log(`Encoding ${frames.length} frames → ${OUT}`);
  if (hasBin('gifski')) {
    // gifski produces noticeably better quality than ffmpeg's palettegen for
    // images with text and thin lines (which is most of this card).
    execFileSync(
      'gifski',
      [
        '--fps',
        String(FPS),
        '--width',
        '960',
        '--quality',
        '90',
        '--output',
        OUT,
        ...frames,
      ],
      { stdio: 'inherit' },
    );
  } else if (hasBin('ffmpeg')) {
    console.log('gifski not found — falling back to ffmpeg (slightly larger output).');
    const palette = path.join(tmp, 'palette.png');
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-framerate',
        String(FPS),
        '-i',
        path.join(tmp, 'frame-%04d.png'),
        '-vf',
        'scale=960:-1:flags=lanczos,palettegen',
        palette,
      ],
      { stdio: 'inherit' },
    );
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-framerate',
        String(FPS),
        '-i',
        path.join(tmp, 'frame-%04d.png'),
        '-i',
        palette,
        '-filter_complex',
        'scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5',
        OUT,
      ],
      { stdio: 'inherit' },
    );
  } else {
    throw new Error('Need gifski or ffmpeg installed to encode the GIF.');
  }

  // Clean up.
  fs.rmSync(tmp, { recursive: true, force: true });
  const stat = fs.statSync(OUT);
  console.log(`✓ ${OUT} (${(stat.size / 1024).toFixed(0)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
