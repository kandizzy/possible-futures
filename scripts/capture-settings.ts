/**
 * One-off: re-capture only docs/screenshots/24-settings.png with the new
 * Local model card visible. Run this against the sandbox dev server so the
 * shot reflects the seeded tutorial persona, not your real compass.
 *
 * Prerequisites:
 *   npm run dev:sandbox    (in another terminal, populated by seed-tutorial)
 *
 * Run:
 *   npx tsx scripts/capture-settings.ts
 */

import { chromium } from 'playwright';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = path.join(process.cwd(), 'docs', 'screenshots', '24-settings.png');

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = `
      nextjs-portal,
      [data-next-badge-root],
      [data-nextjs-toast] { display: none !important; }
    `;
    (document.head || document.documentElement).appendChild(style);
  });

  console.log(`Navigating to ${BASE}/settings ...`);
  await page.goto(BASE + '/settings');
  await page.waitForTimeout(600);

  console.log('Clicking "Local model" card so the config form is visible...');
  await page.getByRole('button', { name: /Local model/i }).click();
  await page.waitForTimeout(500);

  // Strip Next.js dev UI (badge, overlay, toasts).
  await page.evaluate(() => {
    document.querySelectorAll('*').forEach((el) => {
      const tag = el.tagName;
      if (tag.startsWith('NEXT-') || tag.startsWith('NEXTJS-')) {
        el.remove();
      }
    });
    document.querySelectorAll<HTMLElement>('body > *').forEach((el) => {
      const s = window.getComputedStyle(el);
      if (
        s.position === 'fixed' &&
        parseInt(s.bottom, 10) < 80 &&
        parseInt(s.left, 10) < 80
      ) {
        el.style.display = 'none';
      }
    });
  });

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);

  await page.screenshot({ path: OUT, fullPage: false });
  console.log(`Saved ${OUT}`);

  // Roll the sandbox back to 'api' so the next dev:sandbox session starts clean.
  console.log('Reverting AI mode to Anthropic API...');
  await page.getByRole('button', { name: /Anthropic API/i }).click();
  await page.waitForTimeout(300);

  await browser.close();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
