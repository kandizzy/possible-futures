/**
 * Capture a screenshot of the local title slide for preview before pushing.
 * Used as a sanity check after layout changes.
 */
import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 800 },
    deviceScaleFactor: 2,
  });
  await page.goto('http://localhost:8765/#/0', { waitUntil: 'networkidle' });
  // Wait for Google Fonts (Fraunces with variable axes is a big file) to
  // resolve before snapping, or the title flashes in fallback fonts.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500); // let the GIF finish drawing
  const out = path.join(process.cwd(), '/tmp/title-slide-preview.png');
  await page.screenshot({ path: out, fullPage: false });
  console.log(`Preview at ${out}`);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
