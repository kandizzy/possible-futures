/**
 * Capture tutorial screenshots by walking through the full onboarding flow.
 *
 * Prerequisites:
 *   npm run reset:sandbox
 *   npm run dev:sandbox   (in another terminal)
 *
 * Then run:
 *   npx tsx scripts/capture-tutorial.ts
 *
 * Outputs:
 *   docs/screenshots/01-begin.png ... NN-dashboard.png
 *   docs/TUTORIAL.md (generated markdown with all screenshots)
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const DIR = path.join(process.cwd(), 'docs', 'screenshots');

interface Shot {
  step: number;
  filename: string;
  title: string;
  description: string;
}

const shots: Shot[] = [];
let step = 0;

async function capture(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newPage']>>,
  name: string,
  title: string,
  description: string,
  fullPage = false,
) {
  step++;
  const filename = `${String(step).padStart(2, '0')}-${name}.png`;
  await page.waitForTimeout(400);

  // Strip Next.js dev UI (badge, overlay, toasts) before each shot. The
  // addInitScript CSS catches known selectors, but Next's custom-element
  // names drift across versions, so we also remove anything whose tag starts
  // with NEXT- or NEXTJS- and any suspicious fixed-position node in the
  // bottom-left corner.
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

  await page.screenshot({ path: path.join(DIR, filename), fullPage });
  shots.push({ step, filename, title, description });
  console.log(`  [${step}] ${filename}${fullPage ? ' (full page)' : ''}`);
}

async function clickChipSuggestion(page: Parameters<typeof capture>[0], text: string) {
  // Try clicking a suggestion button. ChipPicker renders them as plain text
  // or "quoted text" depending on the `quoted` prop.
  const plain = page.locator('button', { hasText: text }).filter({ hasText: text }).first();
  const quoted = page.locator('button', { hasText: `"${text}"` }).first();

  for (const btn of [plain, quoted]) {
    if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await page.waitForTimeout(200);
      return;
    }
  }

  // Fallback: type it into the nearest visible chip-picker input and press Enter
  console.warn(`    suggestion button not found for "${text}", typing instead`);
  const inputs = page.locator('input[type="text"]');
  const count = await inputs.count();
  for (let i = count - 1; i >= 0; i--) {
    const input = inputs.nth(i);
    if (await input.isVisible()) {
      await input.scrollIntoViewIfNeeded();
      await input.fill(text);
      await input.press('Enter');
      await page.waitForTimeout(200);
      return;
    }
  }
  console.warn(`    could not add "${text}" — no visible input found`);
}

async function main() {
  fs.mkdirSync(DIR, { recursive: true });

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Hide the Next.js dev overlay/indicator so it doesn't appear in screenshots.
  // Runs before every navigation so the style is in the DOM from first paint.
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = `
      nextjs-portal,
      [data-next-badge-root],
      [data-nextjs-toast] { display: none !important; }
    `;
    (document.head || document.documentElement).appendChild(style);
  });

  // ------------------------------------------------------------------
  // 1. Ritual gate (/begin)
  // ------------------------------------------------------------------
  console.log('Chapter: Begin ritual');
  await page.goto(BASE);
  await page.waitForURL('**/begin', { timeout: 10000 });
  await capture(page, 'begin', 'The Ritual', 'Before you start, Possible Futures asks you to commit to writing this yourself.');

  // Check all three boxes
  const labels = page.locator('label').filter({ has: page.locator('input[type="checkbox"]') });
  for (let i = 0; i < 3; i++) {
    await labels.nth(i).click();
    await page.waitForTimeout(100);
  }
  await capture(page, 'begin-ready', 'Ready to Begin', 'Three commitments checked. The button activates.');

  // Click begin
  await page.getByRole('button', { name: /begin the intake/i }).click();
  await page.waitForURL('**/onboarding/1', { timeout: 10000 });

  // ------------------------------------------------------------------
  // 2. Chapter 1: The Setup
  // ------------------------------------------------------------------
  console.log('Chapter 1: The Setup');
  await capture(page, 'ch1-empty', 'Chapter 1: The Setup', 'Your name, education, and the through-line that connects your work.');

  // Fill in contact
  await page.getByPlaceholder('Your name').fill('Jadzia Dax');
  await page.getByPlaceholder('email@example.com').fill('dax@ds9.starfleet.fed');
  await page.getByPlaceholder('City, State').fill('Deep Space Nine');
  await page.getByPlaceholder('yourwebsite.com').fill('jadziadax.dev');

  // Add education
  await page.getByRole('button', { name: /add your first/i }).click();
  await page.waitForTimeout(200);
  await page.getByPlaceholder(/BS, MFA/i).fill('Doctorate, Exobiology');
  await page.getByPlaceholder('School').fill('Starfleet Academy');
  await page.getByPlaceholder('Year').fill('2369');

  // Through-line
  await page.getByPlaceholder(/I make interfaces/i).fill(
    'I connect disciplines that don\'t usually talk to each other, carrying what I learned in past lives into whatever I build next.'
  );

  // Current situation
  await page.getByPlaceholder(/Just finished/i).fill(
    'Eight lifetimes of experience, currently looking for a role where the breadth actually matters.'
  );

  await capture(page, 'ch1-filled', 'Chapter 1: Filled In', 'Contact info, education, and a through-line that anchors everything.');

  await page.getByRole('button', { name: /next chapter/i }).click();
  await page.waitForURL('**/onboarding/2', { timeout: 10000 });

  // ------------------------------------------------------------------
  // 3. Chapter 2: The Throughline (Roles)
  // ------------------------------------------------------------------
  console.log('Chapter 2: The Throughline');
  await capture(page, 'ch2-empty', 'Chapter 2: The Throughline', 'Your last three roles. The spine of your career story.');

  // Add 3 roles
  const roles = [
    {
      title: 'Science Officer',
      company: 'Deep Space Nine, Starfleet',
      start: 'Stardate 46379.1',
      end: 'Present',
      summary: 'Lead science officer on a station at the mouth of a stable wormhole. First contact, anomaly response, sensor array design.',
      proudest: 'Mapped the Bajoran wormhole\'s gravitometric patterns, enabling safe passage for civilian traffic.',
      stack: 'Sensor arrays, subspace telemetry, tricorder field mods',
      notes: 'The wormhole aliens don\'t experience linear time. Trying to write a resume for them would be impossible. Also Worf is here now which is... a lot. Quark keeps asking me to optimize his dabo tables and I keep saying no.',
    },
    {
      title: 'Federation Diplomat',
      company: 'Federation Council (as Curzon Dax)',
      start: 'Stardate 17582.4',
      end: 'Stardate 44820.3',
      summary: 'Negotiated the Khitomer Accords. Mentored a generation of officers including Benjamin Sisko.',
      proudest: 'Brokered the first Klingon-Federation cultural exchange that didn\'t end in a bat\'leth fight.',
      stack: 'Klingon language, treaty law, bloodwine tolerance',
      notes: 'Curzon was brilliant but difficult. Half the Council loved him, half wanted him recalled. The Klingon stuff is genuine though — he earned that respect. Sisko still calls me "old man" which tells you everything about how that mentorship landed.',
    },
    {
      title: 'Research Fellow, Mathematics',
      company: 'Trill Science Ministry (as Tobin Dax)',
      start: 'Stardate 2245.0',
      end: 'Stardate 8542.7',
      summary: 'Published foundational work on transporter phase-variance equations. Quiet tenure, high impact.',
      proudest: 'The phase-correction algorithm is still standard in every transporter pad in the fleet.',
      stack: 'Subspace calculus, isolinear architecture, pattern buffers',
      notes: '',
    },
  ];

  for (let i = 0; i < roles.length; i++) {
    if (i === 0) {
      await page.getByRole('button', { name: /add a role/i }).click();
    } else {
      await page.getByRole('button', { name: /add a role/i }).click();
    }
    await page.waitForTimeout(300);

    const r = roles[i];
    // Role cards are added in order — target by position in the list
    const cards = page.locator('div.border.border-rule').filter({ hasText: /Role №/ });
    const card = cards.nth(i);
    await card.getByPlaceholder('Design Engineer').fill(r.title);
    await card.getByPlaceholder('Mirror Studio').fill(r.company);
    await card.getByPlaceholder('Jan 2024').fill(r.start);
    await card.getByPlaceholder('Present').fill(r.end);
    await card.getByPlaceholder('What did you do here').fill(r.summary);
    await card.getByPlaceholder(/specific outcome/i).fill(r.proudest);
    await card.getByPlaceholder(/React, Three/i).fill(r.stack);
    if (r.notes) {
      const notesField = card.getByPlaceholder(/Dump whatever/i);
      await notesField.scrollIntoViewIfNeeded();
      await notesField.fill(r.notes);
    }
  }

  await capture(page, 'ch2-filled', 'Chapter 2: Three Roles', 'Three roles with summaries and proudest moments. Enough to draw a throughline.');

  await page.getByRole('button', { name: /next chapter/i }).click();
  await page.waitForURL('**/onboarding/3', { timeout: 10000 });

  // ------------------------------------------------------------------
  // 4. Chapter 3: What You're Looking For
  // ------------------------------------------------------------------
  console.log('Chapter 3: Looking For');
  await capture(page, 'ch3-empty', 'Chapter 3: What You\'re Looking For', 'Dream role, target companies, signal words, and your compensation floor.');

  // Dream role
  await page.getByPlaceholder(/Staff Design Engineer at a small team/i).fill(
    'Chief Science Officer on a deep-space assignment where eight lifetimes of pattern recognition actually matter.'
  );

  // Role tiers — click suggestions
  await clickChipSuggestion(page, 'Research Scientist');
  await clickChipSuggestion(page, 'Principal Engineer');
  await clickChipSuggestion(page, 'Senior Data Scientist');
  await clickChipSuggestion(page, 'Tech Lead');
  await clickChipSuggestion(page, 'Solutions Architect');

  // Target companies — click a few
  await clickChipSuggestion(page, 'Anthropic');
  await clickChipSuggestion(page, 'Benchling');
  await clickChipSuggestion(page, 'Cloudflare');

  // Signal words — need 3+
  await clickChipSuggestion(page, 'research');
  await clickChipSuggestion(page, 'cross-functional');
  await clickChipSuggestion(page, 'distributed systems');
  await clickChipSuggestion(page, 'small team');
  await clickChipSuggestion(page, 'infrastructure');

  // Compensation (Starfleet doesn't use money, but the Ferengi insist)
  await page.getByPlaceholder('150000').fill('0');

  // Location
  await page.getByPlaceholder(/NYC, remote/i).fill('Alpha Quadrant, open to wormhole-adjacent');
  await page.locator('input[type="checkbox"]').last().check();

  await page.evaluate(() => window.scrollTo(0, 0));
  await capture(page, 'ch3-filled', 'Chapter 3: Signal Words & Targets', 'Dream role, role tiers, signal words, and a compensation floor. This powers the scoring rubric.');

  await page.getByRole('button', { name: /next chapter/i }).click();
  await page.waitForURL('**/onboarding/4', { timeout: 10000 });

  // ------------------------------------------------------------------
  // 5. Chapter 4: The Playbook
  // ------------------------------------------------------------------
  console.log('Chapter 4: The Playbook');
  await capture(page, 'ch4-empty', 'Chapter 4: The Playbook', 'Your guardrails. Red flags that lower scores, words to ban from your writing, and voice calibration.');

  // Red flags — 3+
  await clickChipSuggestion(page, 'rockstar');
  await clickChipSuggestion(page, 'ninja');
  await clickChipSuggestion(page, 'hustle');
  await clickChipSuggestion(page, 'crushing it');

  // Banned words
  await clickChipSuggestion(page, 'spearheaded');
  await clickChipSuggestion(page, 'leveraged');
  await clickChipSuggestion(page, 'synergy');

  // Voice samples — click a couple phrases
  for (const phrase of ['matter to someone specific', 'ship something small and right', 'explain their reasoning']) {
    const btn = page.locator('button').filter({ hasText: phrase }).first();
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(150);
    }
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await capture(page, 'ch4-filled', 'Chapter 4: Playbook Started', 'Red flags that lower scores, banned words for generated content, and phrases that sound like you.');

  await page.getByRole('button', { name: /next chapter/i }).click();
  await page.waitForURL('**/onboarding/5', { timeout: 10000 });

  // ------------------------------------------------------------------
  // 6. Chapter 5: The Shelf of Proof
  // ------------------------------------------------------------------
  console.log('Chapter 5: Shelf of Proof');
  await capture(page, 'ch5-empty', 'Chapter 5: The Shelf of Proof', 'Projects that prove you can do the work. Three minimum.');

  const projects = [
    { title: 'Wormhole Cartography Suite', desc: 'Real-time gravitometric mapping of the Bajoran wormhole. Turned a navigation hazard into a commuter lane.', stack: 'Sensor arrays, subspace telemetry, LCARS' },
    { title: 'Symbiont Compatibility Index', desc: 'A matching algorithm for the Trill Symbiosis Commission. Reduced failed joinings by 40%.', stack: 'Bioelectric modeling, neural-pattern analysis' },
    { title: 'Klingon Opera Transcription Engine', desc: 'Automated transcription of oral Klingon opera traditions into searchable archives. Curzon started it, Jadzia finished it.', stack: 'Universal translator APIs, acoustic analysis, tlhIngan Hol NLP' },
  ];

  for (let i = 0; i < projects.length; i++) {
    await page.getByRole('button', { name: /add a project/i }).click();
    await page.waitForTimeout(300);
    const card = page.locator('[class*="border"]').filter({ hasText: new RegExp(`Project.*${String(i + 1).padStart(2, '0')}`) }).first();
    await card.getByPlaceholder('Title').fill(projects[i].title);
    await card.getByPlaceholder(/One sentence/i).fill(projects[i].desc);
    await card.getByPlaceholder(/Stack/i).fill(projects[i].stack);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await capture(page, 'ch5-filled', 'Chapter 5: Three Projects', 'Three projects with descriptions and tech stacks. The proof shelf.');

  // Scroll to resume versions section at the bottom
  const addVersionBtn = page.getByRole('button', { name: /add a version/i });
  if (await addVersionBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await addVersionBtn.scrollIntoViewIfNeeded();
  } else {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }
  await page.waitForTimeout(400);
  await capture(page, 'ch5-versions', 'Resume Versions', 'Define as many resume versions as you need. Different roles call for different emphasis. Add, remove, or rename them.');

  await page.getByRole('button', { name: /ready to publish/i }).click();
  await page.waitForURL('**/onboarding/publish', { timeout: 10000 });

  // ------------------------------------------------------------------
  // 7. Publish / The Reveal
  // ------------------------------------------------------------------
  console.log('Publish page');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await capture(page, 'publish-preview', 'The Reveal', 'Preview your generated Book, Compass, and Playbook before publishing.');

  // Click Compass tab
  const compassTab = page.getByRole('button', { name: /Part II.*Compass/i });
  if (await compassTab.isVisible({ timeout: 1000 }).catch(() => false)) {
    await compassTab.click();
    await page.waitForTimeout(200);
    await capture(page, 'publish-compass', 'The Compass Preview', 'Your generated Job Search Compass — the scoring rubric that evaluates every posting.');
  }

  // Click Playbook tab
  const playbookTab = page.getByRole('button', { name: /Part III.*Playbook/i });
  if (await playbookTab.isVisible({ timeout: 1000 }).catch(() => false)) {
    await playbookTab.click();
    await page.waitForTimeout(200);
    await capture(page, 'publish-playbook', 'The Playbook Preview', 'Your Application Playbook — resume rules, cover letter rules, banned words, and version strategies. These three documents are plain markdown. You can edit them directly to customize how Claude scores and writes for you.');
  }

  // Publish
  await page.getByRole('button', { name: /publish/i }).click();
  await page.waitForTimeout(3000);
  // Success state renders below the preview — scroll to "Open Possible Futures" button
  const successBtn = page.getByRole('button', { name: /Open Possible Futures/i });
  if (await successBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await successBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }
  await capture(page, 'publish-done', 'Published', 'Your first edition is set. Possible Futures is primed and ready.');

  // ------------------------------------------------------------------
  // Seed sample data for populated page screenshots
  // ------------------------------------------------------------------
  console.log('Seeding tutorial data...');
  const { execSync } = await import('child_process');
  execSync('DB_FILE=sandbox.db npx tsx scripts/seed-tutorial.ts', {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  // Navigate to dashboard
  const openBtn = page.getByRole('button', { name: /Open Possible Futures/i });
  if (await openBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await openBtn.click();
  } else {
    await page.goto(BASE);
  }
  await page.waitForTimeout(500);

  // ------------------------------------------------------------------
  // 8. Dashboard (populated)
  // ------------------------------------------------------------------
  console.log('Post-onboarding pages');
  await page.waitForURL(BASE + '/', { timeout: 10000 });
  await capture(page, 'dashboard', 'The Dashboard', 'Your index of possible futures. Every role scored against your compass, with status tracking across your pipeline.');

  // ------------------------------------------------------------------
  // 9. Role detail — click the first role (JPL, highest score)
  // ------------------------------------------------------------------
  const firstRole = page.locator('a[href^="/roles/"]').first();
  if (await firstRole.isVisible({ timeout: 2000 }).catch(() => false)) {
    await firstRole.click();
    await page.waitForTimeout(500);
    // Scroll down a bit to show the score breakdown, not just the header
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(300);
    await capture(page, 'role-detail', 'Role Detail', 'The full scoring breakdown for a single role. Six dimensions, a fit summary, signal words found, and the AI recommendation.');

    // Scroll to fit summary
    const fitSummary = page.locator('text=Fit Summary').first();
    if (await fitSummary.isVisible({ timeout: 1000 }).catch(() => false)) {
      await fitSummary.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await capture(page, 'role-fit-summary', 'Fit Summary', 'The AI writes a narrative assessment of how this role maps to your compass. Calibrate the scores if you disagree.');
    }
  }

  // ------------------------------------------------------------------
  // 10. Evaluate page
  // ------------------------------------------------------------------
  await page.goto(BASE + '/evaluate');
  await page.waitForTimeout(500);
  await capture(page, 'evaluate', 'Evaluate a Role', 'Paste a job posting and let the compass score it against everything you care about.');

  // ------------------------------------------------------------------
  // 11. Discover page
  // ------------------------------------------------------------------
  await page.goto(BASE + '/discover');
  await page.waitForTimeout(500);
  await capture(page, 'discover', 'Discover Companies', 'Claude reads your compass and suggests companies likely to be hiring roles that fit.');

  // ------------------------------------------------------------------
  // 12. Companies page (now with pipeline data)
  // ------------------------------------------------------------------
  await page.goto(BASE + '/companies');
  await page.waitForTimeout(500);
  await capture(page, 'companies', 'The Houses', 'Your company watchlist with pipeline status. See how many roles you\'ve scored, applied to, and where you\'re interviewing.');

  // ------------------------------------------------------------------
  // 13. Ledger page
  // ------------------------------------------------------------------
  await page.goto(BASE + '/ledger');
  await page.waitForTimeout(500);
  await capture(page, 'ledger', 'The Ledger', 'Every API call, its cost, and what it was for. The Federation doesn\'t use money, but Claude does. Track your spend in latinum or USD.');

  // ------------------------------------------------------------------
  // 14. Settings page
  // ------------------------------------------------------------------
  await page.goto(BASE + '/settings');
  await page.waitForTimeout(500);
  // Click "Local model" so the local-config form is visible in the screenshot.
  // Roll it back afterward so the sandbox DB doesn't change ai_mode permanently.
  const localCard = page.getByRole('button', { name: /Local model/i });
  await localCard.click();
  await page.waitForTimeout(400);
  await capture(page, 'settings', 'Settings', 'Tune your compass, choose your AI backend (Anthropic API, Claude Code, or a local LM Studio / Ollama model), and manage signal words.');
  await page.getByRole('button', { name: /Anthropic API/i }).click();
  await page.waitForTimeout(200);

  await browser.close();

  // ------------------------------------------------------------------
  // Generate markdown
  // ------------------------------------------------------------------
  const lines = [
    '# Possible Futures — Tutorial',
    '',
    'A walkthrough of the onboarding flow and main screens.',
    '',
  ];

  for (const s of shots) {
    lines.push(`## ${s.step}. ${s.title}`);
    lines.push('');
    lines.push(s.description);
    lines.push('');
    lines.push(`![${s.title}](screenshots/${s.filename})`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('*Generated by `scripts/capture-tutorial.ts`*');
  lines.push('');

  fs.writeFileSync(path.join(process.cwd(), 'docs', 'TUTORIAL.md'), lines.join('\n'));
  console.log(`\nDone! ${shots.length} screenshots saved to docs/screenshots/`);
  console.log('Tutorial markdown: docs/TUTORIAL.md');
}

main().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
