CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  url TEXT,
  posting_text TEXT,
  salary_range TEXT,
  location TEXT,
  ai_scores TEXT NOT NULL,
  my_scores TEXT,
  ai_recommendation TEXT NOT NULL,
  my_recommendation TEXT,
  recommended_resume_version TEXT,
  signal_words_found TEXT,
  red_flags_found TEXT,
  fit_summary TEXT,
  gap_analysis TEXT,
  status TEXT NOT NULL DEFAULT 'New',
  notes TEXT,
  date_added TEXT NOT NULL DEFAULT (datetime('now')),
  date_applied TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  discovered_by_run_id INTEGER,
  date_reviewed TEXT
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  resume_version_used TEXT,
  cover_letter_text TEXT,
  cover_letter_ai_draft TEXT,
  cover_letter_generated INTEGER DEFAULT 0,
  resume_summary_text TEXT,
  materials_notes TEXT,
  version_folder_path TEXT,
  date_applied TEXT,
  current_status TEXT DEFAULT 'Submitted',
  next_steps TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS calibrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  ai_score INTEGER NOT NULL,
  my_score INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recommendation_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  ai_recommendation TEXT NOT NULL,
  my_recommendation TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  why_interested TEXT,
  careers_url TEXT,
  last_checked TEXT,
  notes TEXT,
  ats_provider TEXT,
  ats_slug TEXT,
  last_scanned_at TEXT,
  skipped_at TEXT,
  source TEXT NOT NULL DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  why_they_matter TEXT,
  url TEXT,
  last_interaction TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS people_companies (
  person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, company_id)
);

CREATE TABLE IF NOT EXISTS compass_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  signal_words TEXT NOT NULL,
  red_flag_words TEXT NOT NULL,
  compensation_floor INTEGER NOT NULL DEFAULT 150000,
  ai_mode TEXT NOT NULL DEFAULT 'api',
  materials_mode TEXT NOT NULL DEFAULT 'summary',
  reasoning_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS materials_calibrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  ai_text TEXT NOT NULL,
  edited_text TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS source_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  last_loaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS onboarding_draft (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  answers TEXT NOT NULL DEFAULT '{}',
  current_chapter INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS onboarding_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  completed_at TEXT,
  published_by TEXT,
  ritual_acknowledged_at TEXT,
  revision_count INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS discovery_runs (
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
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_url ON roles(url) WHERE url IS NOT NULL;

CREATE TABLE IF NOT EXISTS ai_usage_log (
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
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_timestamp ON ai_usage_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_usage_operation ON ai_usage_log(operation);

CREATE TABLE IF NOT EXISTS discovery_suggestions (
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
);

CREATE INDEX IF NOT EXISTS idx_discovery_suggestions_status ON discovery_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_discovery_suggestions_batch ON discovery_suggestions(batch_id);

CREATE TABLE IF NOT EXISTS discovery_postings_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  suggestion_id INTEGER NOT NULL REFERENCES discovery_suggestions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  location TEXT,
  salary TEXT,
  posting_text TEXT
);
