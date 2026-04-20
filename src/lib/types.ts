export interface ScoreDimension {
  score: number;
  rationale: string;
}

export interface AiScores {
  want: ScoreDimension;
  can: ScoreDimension;
  grow: ScoreDimension;
  pay: ScoreDimension;
  team: ScoreDimension;
  impact: ScoreDimension;
}

export interface MyScores {
  want?: number;
  can?: number;
  grow?: number;
  pay?: number;
  team?: number;
  impact?: number;
}

export type Dimension = 'want' | 'can' | 'grow' | 'pay' | 'team' | 'impact';
export type Recommendation = 'apply' | 'skip' | 'stretch';
export type ResumeVersion = 'A' | 'B' | 'C' | 'D';
export type RoleStatus = 'New' | 'Applied' | 'Interviewing' | 'Rejected' | 'Ghosted' | 'Withdrawn' | 'Offer' | 'Skipped';

export interface RoleRow {
  id: number;
  title: string;
  company: string;
  url: string | null;
  posting_text: string | null;
  salary_range: string | null;
  location: string | null;
  ai_scores: string;
  my_scores: string | null;
  ai_recommendation: string;
  my_recommendation: string | null;
  recommended_resume_version: string | null;
  signal_words_found: string | null;
  red_flags_found: string | null;
  fit_summary: string | null;
  gap_analysis: string | null;
  status: string;
  notes: string | null;
  date_added: string;
  date_applied: string | null;
}

export interface Role {
  id: number;
  title: string;
  company: string;
  url: string | null;
  posting_text: string | null;
  salary_range: string | null;
  location: string | null;
  ai_scores: AiScores;
  my_scores: MyScores | null;
  ai_recommendation: Recommendation;
  my_recommendation: Recommendation | null;
  recommended_resume_version: ResumeVersion | null;
  signal_words_found: string[];
  red_flags_found: string[];
  fit_summary: string | null;
  gap_analysis: GapItem[];
  status: RoleStatus;
  notes: string | null;
  date_added: string;
  date_applied: string | null;
  // These three are always present after a DB read (the deserialize helper
  // fills defaults for legacy rows), so the type reflects that.
  source: RoleSource;
  discovered_by_run_id: number | null;
  date_reviewed: string | null;
}

export interface Application {
  id: number;
  role_id: number;
  resume_version_used: ResumeVersion | null;
  cover_letter_text: string | null;
  cover_letter_ai_draft: string | null;
  cover_letter_generated: boolean;
  resume_summary_text: string | null;
  materials_notes: string | null;
  version_folder_path: string | null;
  date_applied: string | null;
  current_status: string;
  next_steps: string | null;
  notes: string | null;
}

export interface Calibration {
  id: number;
  role_id: number;
  dimension: Dimension;
  ai_score: number;
  my_score: number;
  reason: string;
  created_at: string;
}

export interface RecommendationOverride {
  id: number;
  role_id: number;
  ai_recommendation: Recommendation;
  my_recommendation: Recommendation;
  reason: string;
  created_at: string;
}

export interface Company {
  id: number;
  name: string;
  category: string | null;
  why_interested: string | null;
  careers_url: string | null;
  last_checked: string | null;
  notes: string | null;
  ats_provider?: AtsProvider | null;
  ats_slug?: string | null;
  last_scanned_at?: string | null;
  skipped_at?: string | null;
  source?: 'manual' | 'seed' | 'claude_suggestion';
}

export interface CompanyWithPipeline extends Company {
  role_count: number;
  new_count: number;
  applied_count: number;
  interviewing_count: number;
  offer_count: number;
  closed_count: number;
  last_activity: string | null;
}

export interface Person {
  id: number;
  name: string;
  role: string | null;
  company: string | null;
  why_they_matter: string | null;
  url: string | null;
  last_interaction: string | null;
  notes: string | null;
}

export type AiMode = 'api' | 'cli';
export type MaterialsMode = 'full' | 'summary';

export type AtsProvider = 'greenhouse' | 'lever' | 'ashby' | 'workable';
export type RoleSource = 'manual' | 'discovered';
export type DiscoveryRunStatus = 'running' | 'done' | 'error' | 'cancelled';

export interface DiscoveryLogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error';
  msg: string;
}

export interface DiscoveryRun {
  id: number;
  kind: 'roles' | 'companies' | 'people';
  started_at: string;
  ended_at: string | null;
  status: DiscoveryRunStatus;
  companies_checked: number;
  postings_found: number;
  postings_new: number;
  postings_scored: number;
  current_company: string | null;
  error: string | null;
  log: DiscoveryLogEntry[];
}

export interface DiscoveredPosting {
  title: string;
  company: string;
  location?: string;
  salary_range?: string;
  url: string;
  posting_text: string;
  ats_provider: AtsProvider;
}

export type IntakeChapter = 1 | 2 | 3 | 4 | 5;

export interface IntakeEducation {
  degree: string;
  school: string;
  year?: string;
}

export interface IntakeRole {
  id: string;
  title: string;
  company: string;
  start: string;
  end?: string;
  summary: string;
  proudest: string;
  stack?: string;
  raw_notes?: string;
}

export interface IntakeRoleTiers {
  dream: string[];
  strong: string[];
  acceptable: string[];
}

export interface IntakeProject {
  id: string;
  title: string;
  description: string;
  stack?: string;
  serves_versions?: string[];
}

export interface IntakeVersion {
  letter: string;
  label: string;
  emphasis: string;
}

export interface IntakeAnswers {
  // Chapter 1 — The Setup
  name?: string;
  email?: string;
  location?: string;
  website?: string;
  education?: IntakeEducation[];
  through_line?: string;
  current_situation?: string;

  // Chapter 2 — The Throughline
  roles?: IntakeRole[];

  // Chapter 3 — What You're Looking For
  dream_role?: string;
  role_tiers?: IntakeRoleTiers;
  target_companies?: string[];
  signal_words?: string[];
  compensation_floor?: number;
  location_constraint?: string;
  remote_ok?: boolean;

  // Chapter 4 — The Playbook
  red_flag_words?: string[];
  banned_words?: string[];
  sensitive_context?: string;
  voice_samples?: string[];
  custom_voice_sample?: string;

  // Chapter 5 — The Shelf of Proof
  projects?: IntakeProject[];
  recognition?: string[];
  versions?: IntakeVersion[];
}

export interface OnboardingDraft {
  answers: IntakeAnswers;
  current_chapter: IntakeChapter;
  updated_at: string;
}

export interface OnboardingState {
  completed_at: string | null;
  published_by: 'intake' | 'seed' | 'manual' | null;
  ritual_acknowledged_at: string | null;
  revision_count: number;
}

export interface CompassConfig {
  signal_words: string[];
  red_flag_words: string[];
  compensation_floor: number;
  ai_mode: AiMode;
  materials_mode: MaterialsMode;
  reasoning_model: string;
  updated_at: string;
}

export interface SourceFile {
  id: number;
  filename: string;
  content: string;
  last_loaded_at: string;
}

export interface GapItem {
  gap: string;
  why_it_matters: string;
  project_ideas: string[];
  existing_projects: string[];
}

export interface ScoringResponse {
  scores: AiScores;
  total: number;
  recommendation: Recommendation;
  recommended_resume_version: ResumeVersion;
  resume_version_rationale: string;
  signal_words_found: string[];
  red_flags_found: string[];
  fit_summary: string;
  calibration_notes: string;
  role_title: string;
  company: string;
  salary_range: string | null;
  location: string | null;
  gap_analysis: GapItem[];
}

export interface MaterialsResponse {
  cover_letter: string;
  resume: string;
  resume_summary: string;
  resume_version: ResumeVersion;
  version_rationale: string;
  key_projects_to_emphasize: string[];
  projects_to_compress: string[];
}

export function getTotalScore(scores: AiScores | MyScores): number {
  const dims: Dimension[] = ['want', 'can', 'grow', 'pay', 'team', 'impact'];
  return dims.reduce((sum, d) => {
    const val = scores[d];
    if (val === undefined || val === null) return sum;
    return sum + (typeof val === 'object' ? val.score : val);
  }, 0);
}

export function getScoreColor(total: number): string {
  if (total >= 15) return 'text-stamp';
  if (total >= 12) return 'text-ink';
  return 'text-ink-3';
}

export function getScoreBgColor(total: number): string {
  if (total >= 15) return 'bg-stamp/5';
  return '';
}

export function getDimScoreColor(score: number): string {
  if (score >= 3) return 'text-stamp';
  if (score >= 2) return 'text-ink';
  if (score >= 1) return 'text-ink-2';
  return 'text-ink-3';
}

export function getStatusStyle(status: RoleStatus): string {
  switch (status) {
    case 'New':
      return 'text-ink';
    case 'Applied':
      return 'text-ink italic';
    case 'Interviewing':
      return 'text-stamp italic font-medium';
    case 'Offer':
      return 'text-stamp italic font-semibold';
    case 'Rejected':
      return 'text-ink-3 italic line-through decoration-ink-3/50';
    case 'Ghosted':
      return 'text-ink-3 italic';
    case 'Withdrawn':
      return 'text-ink-3 italic line-through decoration-ink-3/50';
    case 'Skipped':
      return 'text-ink-3 italic';
    default:
      return 'text-ink';
  }
}
