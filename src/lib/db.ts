import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// DB_FILE lets you point at a parallel database without touching your real one.
// Default: data/job-search.db. Set DB_FILE=sandbox.db (or anything else) to run
// the app against a throwaway DB — useful for testing the first-run / onboarding
// flow without losing real evaluations.
const DB_FILE = process.env.DB_FILE || 'job-search.db';
const DB_PATH = path.join(process.cwd(), 'data', DB_FILE);
const SCHEMA_PATH = path.join(process.cwd(), 'src', 'lib', 'schema.sql');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    const tableCheck = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='roles'"
    ).get();

    if (!tableCheck) {
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
      db.exec(schema);
    }

    // Migrations for existing databases
    migrate(db);
  }
  return db;
}

function migrate(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(compass_config)").all() as { name: string }[];
  const colNames = new Set(cols.map((c) => c.name));

  if (!colNames.has('ai_mode')) {
    db.exec("ALTER TABLE compass_config ADD COLUMN ai_mode TEXT NOT NULL DEFAULT 'api'");
  }
  if (!colNames.has('materials_mode')) {
    db.exec("ALTER TABLE compass_config ADD COLUMN materials_mode TEXT NOT NULL DEFAULT 'summary'");
  }
  if (!colNames.has('reasoning_model')) {
    db.exec("ALTER TABLE compass_config ADD COLUMN reasoning_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6'");
  }
  if (!colNames.has('local_base_url')) {
    db.exec("ALTER TABLE compass_config ADD COLUMN local_base_url TEXT NOT NULL DEFAULT 'http://localhost:1234/v1'");
  }
  if (!colNames.has('local_model')) {
    db.exec("ALTER TABLE compass_config ADD COLUMN local_model TEXT NOT NULL DEFAULT ''");
  }
  if (!colNames.has('local_api_key')) {
    db.exec("ALTER TABLE compass_config ADD COLUMN local_api_key TEXT");
  }

  // Migration: add gap_analysis to roles table
  const rolesCols = db.prepare("PRAGMA table_info(roles)").all() as { name: string }[];
  const rolesColNames = new Set(rolesCols.map(c => c.name));
  if (!rolesColNames.has('gap_analysis')) {
    db.exec("ALTER TABLE roles ADD COLUMN gap_analysis TEXT");
  }
  if (!rolesColNames.has('archived')) {
    db.exec("ALTER TABLE roles ADD COLUMN archived INTEGER NOT NULL DEFAULT 0");
  }
  if (!rolesColNames.has('date_archived')) {
    db.exec("ALTER TABLE roles ADD COLUMN date_archived TEXT");
  }

  // Migration: add materials_calibrations table
  const matCalTable = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='materials_calibrations'"
  ).get();
  if (!matCalTable) {
    db.exec(`CREATE TABLE materials_calibrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      field TEXT NOT NULL,
      ai_text TEXT NOT NULL,
      edited_text TEXT NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
  }

  // Migration: add cover_letter_ai_draft to applications
  const appCols = db.prepare("PRAGMA table_info(applications)").all() as { name: string }[];
  const appColNames = new Set(appCols.map(c => c.name));
  if (!appColNames.has('cover_letter_ai_draft')) {
    db.exec("ALTER TABLE applications ADD COLUMN cover_letter_ai_draft TEXT");
  }
  if (!appColNames.has('resume_text')) {
    db.exec("ALTER TABLE applications ADD COLUMN resume_text TEXT");
  }

  // Backfill: any application row that has current_status='Submitted' but
  // no date_applied was almost certainly auto-created by the materials draft
  // flow (which used to default to 'Submitted'). Reset those to 'Draft' so
  // the Applications page reflects what was actually sent.
  db.exec(
    "UPDATE applications SET current_status = 'Draft' WHERE current_status = 'Submitted' AND date_applied IS NULL"
  );

  // Backfill: roles whose status moved into the application lifecycle (Applied
  // / Interviewing / Offer / Rejected / Withdrawn) but whose application row
  // is still 'Draft' — happens when the user changed role status via the
  // StatusSelect before the role→app sync existed. Mirror the role status
  // onto the app row so the Applications page reflects reality.
  db.exec(`
    UPDATE applications
    SET current_status = CASE r.status
      WHEN 'Applied' THEN 'Submitted'
      WHEN 'Interviewing' THEN 'Interview'
      WHEN 'Offer' THEN 'Offer'
      WHEN 'Rejected' THEN 'Rejected'
      WHEN 'Withdrawn' THEN 'Withdrawn'
    END,
    date_applied = COALESCE(applications.date_applied, date('now'))
    FROM roles r
    WHERE applications.role_id = r.id
      AND applications.current_status = 'Draft'
      AND r.status IN ('Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn')
  `);

  // Migration: add onboarding_draft and onboarding_state tables
  const draftTable = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='onboarding_draft'"
  ).get();
  if (!draftTable) {
    db.exec(`CREATE TABLE onboarding_draft (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      answers TEXT NOT NULL DEFAULT '{}',
      current_chapter INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
  }
  const stateTable = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='onboarding_state'"
  ).get();
  if (!stateTable) {
    db.exec(`CREATE TABLE onboarding_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      completed_at TEXT,
      published_by TEXT
    )`);
  }

  // Migration: discovery_runs table
  const runsTable = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='discovery_runs'"
  ).get();
  if (!runsTable) {
    db.exec(`CREATE TABLE discovery_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL DEFAULT 'roles',
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT,
      status TEXT NOT NULL DEFAULT 'running',
      companies_checked INTEGER NOT NULL DEFAULT 0,
      postings_found INTEGER NOT NULL DEFAULT 0,
      postings_new INTEGER NOT NULL DEFAULT 0,
      postings_scored INTEGER NOT NULL DEFAULT 0,
      current_company TEXT,
      error TEXT,
      log TEXT NOT NULL DEFAULT '[]'
    )`);
  }

  // Migration: discovery columns on roles
  const rolesColsAfter = db.prepare("PRAGMA table_info(roles)").all() as { name: string }[];
  const rolesColSet = new Set(rolesColsAfter.map((c) => c.name));
  if (!rolesColSet.has('source')) {
    db.exec("ALTER TABLE roles ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'");
  }
  if (!rolesColSet.has('discovered_by_run_id')) {
    db.exec('ALTER TABLE roles ADD COLUMN discovered_by_run_id INTEGER');
  }
  if (!rolesColSet.has('date_reviewed')) {
    db.exec('ALTER TABLE roles ADD COLUMN date_reviewed TEXT');
  }

  // Migration: ATS columns on companies
  const compCols = db.prepare("PRAGMA table_info(companies)").all() as { name: string }[];
  const compColSet = new Set(compCols.map((c) => c.name));
  if (!compColSet.has('ats_provider')) {
    db.exec('ALTER TABLE companies ADD COLUMN ats_provider TEXT');
  }
  if (!compColSet.has('ats_slug')) {
    db.exec('ALTER TABLE companies ADD COLUMN ats_slug TEXT');
  }
  if (!compColSet.has('last_scanned_at')) {
    db.exec('ALTER TABLE companies ADD COLUMN last_scanned_at TEXT');
  }
  if (!compColSet.has('skipped_at')) {
    db.exec('ALTER TABLE companies ADD COLUMN skipped_at TEXT');
  }
  if (!compColSet.has('source')) {
    db.exec("ALTER TABLE companies ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'");
  }

  // Partial unique index on roles.url for dedup. Safe to run repeatedly —
  // CREATE UNIQUE INDEX IF NOT EXISTS will no-op if the index already exists,
  // and will throw if duplicate non-null URLs already exist. In practice the
  // existing data doesn't have duplicate URLs because evaluate.ts only inserts
  // one role per submission; if a user somehow has duplicates, we log and skip.
  try {
    db.exec(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_url ON roles(url) WHERE url IS NOT NULL',
    );
  } catch (err) {
    console.warn('[db] could not create unique index on roles.url:', err);
  }

  // Migration: add ritual_acknowledged_at to onboarding_state
  const onboardingCols = db.prepare("PRAGMA table_info(onboarding_state)").all() as { name: string }[];
  const onboardingColSet = new Set(onboardingCols.map((c) => c.name));
  if (!onboardingColSet.has('ritual_acknowledged_at')) {
    db.exec('ALTER TABLE onboarding_state ADD COLUMN ritual_acknowledged_at TEXT');
    // Grandfather existing users: anyone who already has an onboarding_state row
    // has already been through setup, so we shouldn't block them with the ritual gate.
    db.exec(`UPDATE onboarding_state SET ritual_acknowledged_at = COALESCE(ritual_acknowledged_at, completed_at, datetime('now')) WHERE id = 1`);
  }

  // Migration: revision_count on onboarding_state
  if (!onboardingColSet.has('revision_count')) {
    db.exec("ALTER TABLE onboarding_state ADD COLUMN revision_count INTEGER NOT NULL DEFAULT 1");
  }

  // Migration: ai_usage_log table for API cost tracking
  const usageTable = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='ai_usage_log'"
  ).get();
  if (!usageTable) {
    db.exec(`CREATE TABLE ai_usage_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      operation TEXT NOT NULL,
      model TEXT NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      cache_read_tokens INTEGER NOT NULL DEFAULT 0,
      cache_write_tokens INTEGER NOT NULL DEFAULT 0,
      cost_usd REAL NOT NULL DEFAULT 0,
      context_type TEXT,
      context_id INTEGER,
      error TEXT
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_ai_usage_timestamp ON ai_usage_log(timestamp)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_ai_usage_operation ON ai_usage_log(operation)');
  }

  // Migration: discovery_suggestions + postings cache for persistent discover results
  const suggestionsTable = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='discovery_suggestions'"
  ).get();
  if (!suggestionsTable) {
    db.exec(`CREATE TABLE discovery_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      why_fits TEXT,
      careers_url TEXT,
      verified INTEGER NOT NULL DEFAULT 0,
      verified_provider TEXT,
      verified_slug TEXT,
      open_postings INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      batch_model TEXT,
      batch_cost REAL NOT NULL DEFAULT 0,
      batch_role_type TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_discovery_suggestions_status ON discovery_suggestions(status)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_discovery_suggestions_batch ON discovery_suggestions(batch_id)');
    db.exec(`CREATE TABLE discovery_postings_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      suggestion_id INTEGER NOT NULL REFERENCES discovery_suggestions(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      url TEXT,
      location TEXT,
      salary TEXT,
      posting_text TEXT
    )`);
  }

  // Migration: rename PROJECT_BIBLE → PROJECT_BOOK in source_files
  const oldBible = db.prepare("SELECT id FROM source_files WHERE filename = 'PROJECT_BIBLE'").get();
  if (oldBible) {
    db.exec("UPDATE source_files SET filename = 'PROJECT_BOOK' WHERE filename = 'PROJECT_BIBLE'");
  }
}
