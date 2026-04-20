/**
 * Seed the sandbox database with sample data for tutorial screenshots.
 * Run AFTER the capture script has completed onboarding (so source_files exist).
 *
 *   DB_FILE=sandbox.db npx tsx scripts/seed-tutorial.ts
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_FILE = process.env.DB_FILE || 'sandbox.db';
const DB_PATH = path.join(process.cwd(), 'data', DB_FILE);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// -- Companies ----------------------------------------------------------------

const companies = [
  {
    name: 'NASA Jet Propulsion Laboratory',
    category: 'Space & Research',
    why_interested: 'Deep-space missions, autonomous systems, and sensor engineering at the highest level.',
    careers_url: 'https://www.jpl.nasa.gov/careers',
    ats_provider: 'greenhouse',
    ats_slug: 'nasajpl',
    source: 'claude_suggestion',
  },
  {
    name: 'SETI Institute',
    category: 'Space & Research',
    why_interested: 'Signal processing at interstellar scale. The search itself is the throughline.',
    careers_url: 'https://www.seti.org/careers',
    source: 'claude_suggestion',
  },
  {
    name: 'Starfleet Academy',
    category: 'Education',
    why_interested: 'Where the next generation learns. Eight lifetimes of teaching instinct.',
    source: 'manual',
  },
];

const insertCompany = db.prepare(`
  INSERT INTO companies (name, category, why_interested, careers_url, ats_provider, ats_slug, source)
  VALUES (@name, @category, @why_interested, @careers_url, @ats_provider, @ats_slug, @source)
`);

for (const c of companies) {
  insertCompany.run({
    name: c.name,
    category: c.category,
    why_interested: c.why_interested,
    careers_url: c.careers_url || null,
    ats_provider: c.ats_provider || null,
    ats_slug: c.ats_slug || null,
    source: c.source,
  });
}
console.log(`Inserted ${companies.length} companies`);

// -- Roles --------------------------------------------------------------------

interface RoleData {
  title: string;
  company: string;
  url: string | null;
  salary_range: string | null;
  location: string;
  status: string;
  ai_recommendation: string;
  recommended_resume_version: string;
  ai_scores: Record<string, { score: number; rationale: string }>;
  signal_words_found: string[];
  red_flags_found: string[];
  fit_summary: string;
  posting_text: string;
  date_added: string;
}

const roles: RoleData[] = [
  {
    title: 'Research Scientist, Deep Space Network',
    company: 'NASA Jet Propulsion Laboratory',
    url: 'https://www.jpl.nasa.gov/careers/ds-research-scientist',
    salary_range: '$145,000 - $195,000',
    location: 'Pasadena, CA',
    status: 'Interviewing',
    ai_recommendation: 'apply',
    recommended_resume_version: 'B',
    ai_scores: {
      want: { score: 3, rationale: 'Deep-space telemetry and autonomous sensor systems. This is exactly where eight lifetimes of cross-disciplinary pattern recognition pays off.' },
      can: { score: 3, rationale: 'Subspace telemetry experience maps directly to RF signal processing. Wormhole cartography is literally deep-space navigation research.' },
      grow: { score: 2, rationale: 'New domain (Earth-based deep space comms vs. wormhole-adjacent), but the physics overlap is substantial.' },
      pay: { score: 2, rationale: 'Within range for a government research position. Below private sector but the mission compensates.' },
      team: { score: 3, rationale: 'JPL teams are small, mission-focused, and publish openly. Strong mentorship culture.' },
      impact: { score: 3, rationale: 'Every Voyager signal, every Mars rover command passes through the DSN. Civilizational-scale infrastructure.' },
    },
    signal_words_found: ['research', 'distributed systems', 'small team', 'cross-functional'],
    red_flags_found: [],
    fit_summary: 'This is a near-perfect match. The Deep Space Network role asks for signal processing expertise, autonomous system design, and cross-disciplinary research — all of which map directly to Dax\'s wormhole cartography and sensor array work at DS9. The team structure (small, mission-driven, publishing culture) aligns with every signal word in the compass. The only stretch is adapting from subspace to RF telemetry, but the underlying physics is transferable. Strong apply.',
    posting_text: 'NASA Jet Propulsion Laboratory seeks a Research Scientist for the Deep Space Network team...',
    date_added: '2026-04-15',
  },
  {
    title: 'Senior Signal Processing Engineer',
    company: 'SETI Institute',
    url: 'https://www.seti.org/careers/signal-processing',
    salary_range: '$130,000 - $170,000',
    location: 'Mountain View, CA (hybrid)',
    status: 'Applied',
    ai_recommendation: 'apply',
    recommended_resume_version: 'B',
    ai_scores: {
      want: { score: 3, rationale: 'Interstellar signal detection. Dax has literally made first contact.' },
      can: { score: 2, rationale: 'Signal processing expertise is strong, but SETI\'s specific toolchain (GNU Radio, Python DSP) is different from Starfleet sensors.' },
      grow: { score: 3, rationale: 'Enormous growth potential — leading a signal classification research program, publishing opportunities, conference circuit.' },
      pay: { score: 2, rationale: 'Non-profit research salary. Adequate but not competitive with tech.' },
      team: { score: 3, rationale: 'Small team of passionate researchers. Exactly the kind of environment Dax thrives in.' },
      impact: { score: 3, rationale: 'The literal search for extraterrestrial intelligence. Hard to find higher-impact work.' },
    },
    signal_words_found: ['research', 'small team', 'cross-functional', 'infrastructure'],
    red_flags_found: [],
    fit_summary: 'SETI is a strong cultural fit — small team, research-driven, world-changing mission. The signal processing core maps well to Dax\'s sensor expertise, though the specific toolchain will require ramp-up. The real draw is impact: this is first-contact work, and Dax has more relevant experience than any human candidate. The compensation is below market but the mission makes up for it.',
    posting_text: 'The SETI Institute is seeking a Senior Signal Processing Engineer to join our search pipeline team...',
    date_added: '2026-04-12',
  },
  {
    title: 'VP of Curriculum, Advanced Sciences',
    company: 'Starfleet Academy',
    url: null,
    salary_range: null,
    location: 'San Francisco, CA',
    status: 'New',
    ai_recommendation: 'stretch',
    recommended_resume_version: 'C',
    ai_scores: {
      want: { score: 2, rationale: 'Teaching and mentorship are genuine Dax values (Curzon mentored Sisko, Jadzia mentors everyone). But VP-level administration is a different kind of work.' },
      can: { score: 2, rationale: 'Deep subject matter expertise, strong mentorship track record. But curriculum design at scale and academic politics are new territory.' },
      grow: { score: 2, rationale: 'Would develop leadership and institutional design skills. Less hands-on science.' },
      pay: { score: 3, rationale: 'Starfleet doesn\'t use money.' },
      team: { score: 2, rationale: 'Large institution, committee-driven decisions. Not the small-team environment Dax prefers.' },
      impact: { score: 3, rationale: 'Shaping how the next generation of officers learns science. Multiplier effect on every student.' },
    },
    signal_words_found: ['research', 'cross-functional'],
    red_flags_found: [],
    fit_summary: 'A stretch role. Dax has the subject expertise and mentorship instinct, but VP of Curriculum is an administrative position — committee meetings, budget negotiations, faculty politics. The impact is undeniable (shaping Starfleet science education for decades), but the day-to-day is far from the lab. Worth a conversation, not an automatic apply.',
    posting_text: 'Starfleet Academy seeks a Vice President of Curriculum for the Advanced Sciences division...',
    date_added: '2026-04-10',
  },
  {
    title: 'Chief Science Officer',
    company: 'SpaceX Starship Program',
    url: 'https://www.spacex.com/careers',
    salary_range: '$200,000 - $280,000',
    location: 'Boca Chica, TX',
    status: 'Skipped',
    ai_recommendation: 'skip',
    recommended_resume_version: 'A',
    ai_scores: {
      want: { score: 1, rationale: 'The title is right but the culture is wrong. "Move fast and break things" applied to life support systems is not Dax\'s style.' },
      can: { score: 3, rationale: 'Overqualified. Eight lifetimes of science leadership.' },
      grow: { score: 1, rationale: 'Limited growth in a culture that prioritizes speed over rigor.' },
      pay: { score: 3, rationale: 'Strong compensation package.' },
      team: { score: 1, rationale: 'Known for burnout culture and 80-hour weeks. Red flags in the posting language.' },
      impact: { score: 2, rationale: 'Mars colonization is meaningful, but the approach matters as much as the destination.' },
    },
    signal_words_found: [],
    red_flags_found: ['move fast and break things', 'hustle'],
    fit_summary: 'Hard skip. The title matches but everything else is wrong. The posting uses "fast-paced" three times, mentions "hustle" in the culture section, and the Glassdoor reviews confirm the burnout reputation. Dax has lived enough lifetimes to know that speed without rigor gets people killed — especially in space.',
    posting_text: 'SpaceX is looking for a Chief Science Officer to lead the Starship program\'s science division...',
    date_added: '2026-04-08',
  },
];

const insertRole = db.prepare(`
  INSERT INTO roles (title, company, url, salary_range, location, status, ai_recommendation,
    recommended_resume_version, ai_scores, signal_words_found, red_flags_found,
    fit_summary, posting_text, date_added, source)
  VALUES (@title, @company, @url, @salary_range, @location, @status, @ai_recommendation,
    @recommended_resume_version, @ai_scores, @signal_words_found, @red_flags_found,
    @fit_summary, @posting_text, @date_added, 'manual')
`);

for (const r of roles) {
  insertRole.run({
    title: r.title,
    company: r.company,
    url: r.url,
    salary_range: r.salary_range,
    location: r.location,
    status: r.status,
    ai_recommendation: r.ai_recommendation,
    recommended_resume_version: r.recommended_resume_version,
    ai_scores: JSON.stringify(r.ai_scores),
    signal_words_found: JSON.stringify(r.signal_words_found),
    red_flags_found: JSON.stringify(r.red_flags_found),
    fit_summary: r.fit_summary,
    posting_text: r.posting_text,
    date_added: r.date_added,
  });
}
console.log(`Inserted ${roles.length} roles`);

db.close();
console.log('Tutorial seed complete.');
