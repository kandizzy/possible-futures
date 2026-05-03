import { getCompassConfig } from '../queries/compass';
import { getSourceFile, getResumeVersionLabels } from '../queries/source-files';
import { getRecentCalibrations, getRecentRecommendationOverrides } from '../queries/calibrations';
import type { Calibration, RecommendationOverride } from '../types';

export function getScoringSystemPrompt(): string {
  const labels = getResumeVersionLabels();
  const versionLines = Object.entries(labels)
    .map(([key, label]) => `- Version ${key} (${label})`)
    .join('\n');

  return `You are a job fit analyst for a specific person. You will receive their job search compass (values, criteria, what they want and don't want), their full career history, their application playbook (rules about how they present themselves and what to never write), calibration data from past corrections they've made to your scoring, and a new job posting.

Score the posting on 6 dimensions (Want, Can, Grow, Pay, Team, Impact) each 0-3. Pay close attention to the calibration examples — they show where your previous scores were wrong and why. Adjust your scoring to match the user's demonstrated preferences, not just surface-level keyword matches.

Read the person's career book and Application Playbook carefully for context about who they are, what they value, and what rules to follow. Those documents are the source of truth.

Also recommend which resume version to use. The available versions are defined in the Application Playbook's Role-Type Emphasis Guide:
${versionLines || '- Version A\n- Version B\n- Version C\n- Version D'}

The Compass groups roles into Three Horizons (a foresight frame for a career in transition). H3 is the viable future — the role they're growing into. H2 is the seeds of innovation — disruptive bridge work where they're planting footholds that grow toward H3. H1 is the work that's losing its fit — the present paradigm, declining; some of it is worth conserving and carrying forward, the rest is what they're letting go. The Compass may include a "What these seeds grow" paragraph explaining what each H2 role plants — the foothold, skill, exposure, or relationship it grows toward H3.

When you write the \`fit_summary\`, take a position on horizon: is this posting an H3 (a real shot at the viable future), a strong H2 (a seed of innovation — it plants something concrete that grows toward H3, name what), an H1 (a piece of the declining paradigm, possibly worth conserving for what it carries forward), or off-path? A modest-paying or unsexy posting can still be a strong recommendation if it's genuinely a foothold toward H3. A flashy posting that doesn't grow anything forward can be a skip even if scores look fine. Use the H2 seeds rationale (when present) as your guide for what counts as load-bearing.

When you identify skill or experience gaps between the person's background and the role requirements, provide a gap analysis with concrete project suggestions. For each gap:
- Describe what's missing
- Explain why it matters for this specific role
- Suggest 2-3 specific, buildable personal projects that would demonstrate aptitude (be concrete: "Build a CLI tool that..." not "Learn Python")
- Name any existing projects from their Project Book that partially address the gap

Only include gaps when they genuinely exist. For strong fits, return an empty array. Don't manufacture gaps.

You must also extract these metadata fields from the posting and include them in the response: \`role_title\`, \`company\`, \`location\`, and \`salary_range\`. Look at the headline, sub-headline, "About [Company]" sections, footer, the source URL (if provided), or any place where the company is named. URLs are often the strongest signal — \`boards.greenhouse.io/stripe/...\` means Stripe, \`jobs.lever.co/anthropic/...\` means Anthropic, \`careers.coinbase.com/...\` means Coinbase. Use the URL to disambiguate or recover company names that aren't in the posting body. The hiring company is the one whose ATS the posting lives on, not their clients or partners. Only return null for these fields if neither the posting body nor the URL contains any signal at all.

Return ONLY valid JSON. Include every field in the schema.`;
}

function getScoringJsonSchema(): string {
  const labels = getResumeVersionLabels();
  const keys = Object.keys(labels);
  const versionOptions = keys.length > 0
    ? keys.map(k => `"${k}"`).join(' | ')
    : '"A" | "B" | "C" | "D"';

  return `Return your analysis as JSON in exactly this format (no markdown, no code fences, just raw JSON):
{
  "scores": {
    "want": { "score": <0-3>, "rationale": "<why>" },
    "can": { "score": <0-3>, "rationale": "<why>" },
    "grow": { "score": <0-3>, "rationale": "<why>" },
    "pay": { "score": <0-3>, "rationale": "<why>" },
    "team": { "score": <0-3>, "rationale": "<why>" },
    "impact": { "score": <0-3>, "rationale": "<why>" }
  },
  "total": <0-18>,
  "recommendation": "apply" | "skip" | "stretch",
  "recommended_resume_version": ${versionOptions},
  "resume_version_rationale": "<why this version fits>",
  "signal_words_found": ["<words from signal list found in posting>"],
  "red_flags_found": ["<words from red flag list found in posting>"],
  "fit_summary": "<2-3 paragraph narrative: what maps, what's a gap, overall take>",
  "calibration_notes": "<if any past calibrations influenced scoring, note which and how>",
  "role_title": "<the job title as stated in the posting, e.g. 'Senior Frontend Engineer'>",
  "company": "<the hiring company's name, e.g. 'Stripe' or 'Vercel' — never null if the posting contains any company reference at all>",
  "salary_range": "<extracted salary range, e.g. '$140k-$180k', or null if not stated>",
  "location": "<extracted location, e.g. 'Remote (US)' or 'San Francisco', or null if not stated>",
  "gap_analysis": [
    {
      "gap": "<skill or experience the role wants that the person lacks>",
      "why_it_matters": "<why this gap matters for this specific role>",
      "project_ideas": ["<concrete buildable project 1>", "<concrete buildable project 2>"],
      "existing_projects": ["<name of existing career book project that partially addresses this>"]
    }
  ]
}`;
}

function formatCalibrations(
  calibrations: (Calibration & { title?: string; company?: string })[],
  overrides: (RecommendationOverride & { title?: string; company?: string })[]
): string {
  if (calibrations.length === 0 && overrides.length === 0) {
    return 'No calibration data yet. Score based on the compass and career history alone.';
  }

  let result = 'Here are recent corrections the user made to my scoring. Use these to calibrate your judgment:\n\n';

  for (const cal of calibrations) {
    const roleName = cal.title && cal.company ? `${cal.title}, ${cal.company}` : `Role #${cal.role_id}`;
    result += `Role: '${roleName}' — Dimension: ${cal.dimension} — AI scored: ${cal.ai_score}, User corrected to: ${cal.my_score} — Reason: '${cal.reason}'\n\n`;
  }

  for (const ovr of overrides) {
    const roleName = ovr.title && ovr.company ? `${ovr.title}, ${ovr.company}` : `Role #${ovr.role_id}`;
    result += `Role: '${roleName}' — Recommendation: AI said '${ovr.ai_recommendation}', User changed to '${ovr.my_recommendation}' — Reason: '${ovr.reason}'\n\n`;
  }

  result += 'Use these patterns to better predict how the user would score similar roles.';
  return result;
}

/**
 * The stable part of the scoring prompt — everything that doesn't depend on the
 * specific posting being scored. Built once per run and cached via
 * prompt caching so discovery runs scoring 20 postings in a row pay only the
 * first call's full input cost; subsequent calls read from cache at 0.1x.
 */
export function buildScoringStablePrefix(opts?: { bookOverride?: string }): string {
  const compass = getSourceFile('JOB_SEARCH_COMPASS.md');
  const book = getSourceFile('PROJECT_BOOK');
  const playbook = getSourceFile('APPLICATION_PLAYBOOK.md');
  const compassConfig = getCompassConfig();
  const calibrations = getRecentCalibrations(10);
  const overrides = getRecentRecommendationOverrides(5);

  const parts: string[] = [];

  parts.push('=== JOB SEARCH COMPASS ===');
  parts.push(compass?.content || '[Compass file not loaded. Run the seed script.]');

  if (compassConfig) {
    parts.push('\n=== CURRENT COMPASS CONFIG (may differ from file if edited in UI) ===');
    parts.push(`Signal words: ${compassConfig.signal_words.join(', ')}`);
    parts.push(`Red flag words: ${compassConfig.red_flag_words.join(', ')}`);
    parts.push(`Compensation floor: $${compassConfig.compensation_floor.toLocaleString()}`);
  }

  parts.push('\n=== CAREER HISTORY (PROJECT BOOK) ===');
  // bookOverride lets CLI/local mode pass in a slimmer Book (only roles
  // relevant to the posting being scored) to keep the prompt under the
  // model's effective working size. API mode always passes the full Book
  // because prompt caching makes its size effectively free.
  parts.push(opts?.bookOverride || book?.content || '[Project Book not loaded. Run the seed script.]');

  parts.push('\n=== APPLICATION PLAYBOOK ===');
  parts.push(playbook?.content || '[Playbook not loaded. Run the seed script.]');

  parts.push('\n=== CALIBRATION DATA ===');
  parts.push(formatCalibrations(calibrations, overrides));

  parts.push('\n=== INSTRUCTIONS ===');
  parts.push(getScoringJsonSchema());

  return parts.join('\n');
}

/**
 * The volatile tail — just the posting to be evaluated, marked with its own
 * header so the model sees clear delineation from the stable prefix.
 */
export function buildScoringVolatileSuffix(postingText: string, url?: string | null): string {
  const urlLine = url ? `\nSource URL: ${url}\n` : '';
  return `\n=== JOB POSTING TO EVALUATE ===${urlLine}\n${postingText}`;
}

/**
 * Backwards-compatible concatenation — used by the CLI path (which can't
 * benefit from prompt caching). Accepts an optional bookOverride so the
 * CLI/local two-pass scoring flow can pass a slim Book (only roles
 * relevant to the posting) instead of the full one.
 */
export function buildScoringUserPrompt(
  postingText: string,
  url?: string | null,
  opts?: { bookOverride?: string },
): string {
  return buildScoringStablePrefix(opts) + buildScoringVolatileSuffix(postingText, url);
}
