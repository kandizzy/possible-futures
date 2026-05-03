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
