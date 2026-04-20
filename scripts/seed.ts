// For migrating existing markdown files. Most users should use the in-app
// onboarding at http://localhost:3000.

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { parseCompass } from '../src/lib/parsers/compass';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const RESUME_DIR = path.resolve(PROJECT_ROOT, '..');
// DB_FILE matches the runtime behavior in src/lib/db.ts.
const DB_FILE = process.env.DB_FILE || 'job-search.db';
const DB_PATH = path.join(PROJECT_ROOT, 'data', DB_FILE);
const SCHEMA_PATH = path.join(PROJECT_ROOT, 'src', 'lib', 'schema.sql');

// Load .env.local so PROJECT_BOOK is available outside of Next.js
const envPath = path.join(PROJECT_ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

// Project Book filename is configurable via env var
const BIBLE_FILENAME = process.env.PROJECT_BOOK || '[Your_Name]_Project_Book.md';

// Source files relative to resume directory
const SOURCE_FILES: Record<string, string> = {
  'JOB_SEARCH_COMPASS.md': path.join(RESUME_DIR, 'JOB_SEARCH_COMPASS.md'),
  'PROJECT_BOOK': path.join(RESUME_DIR, BIBLE_FILENAME),
  'APPLICATION_PLAYBOOK.md': path.join(RESUME_DIR, 'APPLICATION_PLAYBOOK.md'),
  'CLAUDE.md': path.join(RESUME_DIR, 'CLAUDE.md'),
};

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Back up and delete existing DB for clean seed
if (fs.existsSync(DB_PATH)) {
  const backupPath = `${DB_PATH}.backup-${Date.now()}`;
  fs.copyFileSync(DB_PATH, backupPath);
  fs.unlinkSync(DB_PATH);
  console.log(`Backed up existing database to ${path.basename(backupPath)}`);
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);
console.log('Created tables');

// Load and cache source files
for (const [filename, filepath] of Object.entries(SOURCE_FILES)) {
  if (!fs.existsSync(filepath)) {
    console.warn(`Warning: ${filepath} not found, skipping`);
    continue;
  }
  const content = fs.readFileSync(filepath, 'utf-8');
  db.prepare(`
    INSERT INTO source_files (filename, content, last_loaded_at)
    VALUES (?, ?, datetime('now'))
  `).run(filename, content);
  console.log(`Cached ${filename} (${content.length} bytes)`);
}

// Parse compass
const compassPath = SOURCE_FILES['JOB_SEARCH_COMPASS.md'];
if (!fs.existsSync(compassPath)) {
  console.error(`ERROR: JOB_SEARCH_COMPASS.md not found at ${compassPath}`);
  process.exit(1);
}
const compassText = fs.readFileSync(compassPath, 'utf-8');
const parsed = parseCompass(compassText);

console.log(`\nParsed compass:`);
console.log(`  ${parsed.roles.length} scored roles`);
console.log(`  ${parsed.companies.length} companies`);
console.log(`  ${parsed.people.length} people`);
console.log(`  ${parsed.signal_words.length} signal words`);
console.log(`  ${parsed.red_flag_words.length} red flag words`);

if (parsed.signal_words.length === 0) {
  console.warn('Warning: No signal words parsed. Check the format in JOB_SEARCH_COMPASS.md.');
}
if (parsed.red_flag_words.length === 0) {
  console.warn('Warning: No red flag words parsed. Check the format in JOB_SEARCH_COMPASS.md.');
}

// Seed compass config
db.prepare(`
  INSERT OR REPLACE INTO compass_config (id, signal_words, red_flag_words, compensation_floor, updated_at)
  VALUES (1, ?, ?, ?, datetime('now'))
`).run(
  JSON.stringify(parsed.signal_words),
  JSON.stringify(parsed.red_flag_words),
  parsed.compensation_floor,
);
console.log('\nSeeded compass config');

// Seed pre-scored roles
// Derive company name by matching role title against known companies from the compass
const companyNames = parsed.companies.map(c => c.name);

function extractCompany(roleTitle: string): string {
  const titleLower = roleTitle.toLowerCase();

  // 1. Exact prefix match against known company names (longest wins)
  const prefixMatches = companyNames
    .filter(name => titleLower.startsWith(name.toLowerCase()))
    .sort((a, b) => b.length - a.length);
  if (prefixMatches.length > 0) return prefixMatches[0];

  // 2. Check if the first word of the role title matches the first word of any company
  //    Handles "Google Seed Studio" matching "Google DeepMind / Seed Studio"
  const firstWord = titleLower.split(' ')[0];
  const firstWordMatch = companyNames.find(name =>
    name.toLowerCase().split(/[\s/]+/)[0] === firstWord
  );
  if (firstWordMatch) return firstWordMatch.split('/')[0].trim();

  // 3. Fallback: leave empty rather than guessing incorrectly
  return '';
}

const insertRole = db.prepare(`
  INSERT INTO roles (title, company, ai_scores, ai_recommendation, recommended_resume_version, status, posting_text)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const role of parsed.roles) {
  const company = extractCompany(role.title);
  const total = role.total;
  const recommendation = total >= 15 ? 'apply' : total >= 12 ? 'stretch' : 'skip';
  const status = 'New';

  const aiScores = {
    want: { score: role.want, rationale: 'Pre-scored in compass' },
    can: { score: role.can, rationale: 'Pre-scored in compass' },
    grow: { score: role.grow, rationale: 'Pre-scored in compass' },
    pay: { score: role.pay, rationale: 'Pre-scored in compass' },
    team: { score: role.team, rationale: 'Pre-scored in compass' },
    impact: { score: role.impact, rationale: 'Pre-scored in compass' },
  };

  insertRole.run(
    role.title,
    company,
    JSON.stringify(aiScores),
    recommendation,
    null,
    status,
    'Pre-scored role from JOB_SEARCH_COMPASS.md. No posting text available.',
  );
}
console.log(`Seeded ${parsed.roles.length} roles`);

// Seed companies
const insertCompany = db.prepare(`
  INSERT INTO companies (name, category, why_interested, careers_url)
  VALUES (?, ?, ?, ?)
`);

for (const company of parsed.companies) {
  insertCompany.run(company.name, company.category, company.why_interested, null);
}
console.log(`Seeded ${parsed.companies.length} companies`);

// Seed people
const insertPerson = db.prepare(`
  INSERT INTO people (name, why_they_matter)
  VALUES (?, ?)
`);

for (const person of parsed.people) {
  insertPerson.run(person.name, person.description);
}
console.log(`Seeded ${parsed.people.length} people`);

// Link people to companies where possible
const allCompanies = db.prepare('SELECT * FROM companies').all() as { id: number; name: string }[];
const allPeople = db.prepare('SELECT * FROM people').all() as { id: number; name: string; why_they_matter: string }[];

const linkStmt = db.prepare('INSERT OR IGNORE INTO people_companies (person_id, company_id) VALUES (?, ?)');

// Auto-link people to companies by checking if any company name appears in the person's description
for (const person of allPeople) {
  for (const company of allCompanies) {
    if (person.why_they_matter.toLowerCase().includes(company.name.toLowerCase())) {
      linkStmt.run(person.id, company.id);
      console.log(`  Linked ${person.name} -> ${company.name}`);
    }
  }
}

db.close();
console.log('\nSeed complete!');
