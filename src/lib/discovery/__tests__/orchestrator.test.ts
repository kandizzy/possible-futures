import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runRoleDiscovery } from '../orchestrator';
import {
  insertDiscoveryRun,
  getDiscoveryRun,
  updateDiscoveryRun,
} from '@/lib/queries/discovery';
import { insertRole, getAllRoles } from '@/lib/queries/roles';
import { makeAiScores } from '@/test/db-helper';
import type {
  Company,
  DiscoveredPosting,
  ScoringResponse,
  AtsProvider,
} from '@/lib/types';

function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: 1,
    name: 'Anthropic',
    category: 'AI',
    why_interested: null,
    careers_url: null,
    last_checked: null,
    notes: null,
    ats_provider: 'greenhouse',
    ats_slug: 'anthropic',
    last_scanned_at: null,
    ...overrides,
  };
}

function makePosting(overrides: Partial<DiscoveredPosting> = {}): DiscoveredPosting {
  return {
    title: 'Design Engineer',
    company: 'Anthropic',
    location: 'Remote',
    url: 'https://job-boards.greenhouse.io/anthropic/jobs/1',
    posting_text: 'Help us build interfaces for safe AI.',
    ats_provider: 'greenhouse',
    ...overrides,
  };
}

function makeScoring(overrides: Partial<ScoringResponse> = {}): ScoringResponse {
  return {
    scores: makeAiScores(),
    total: 12,
    recommendation: 'apply',
    recommended_resume_version: 'B',
    resume_version_rationale: 'Maker version',
    signal_words_found: ['craft'],
    red_flags_found: [],
    fit_summary: 'Solid fit',
    calibration_notes: '',
    role_title: 'Design Engineer',
    company: 'Anthropic',
    salary_range: '$160-220k',
    location: 'Remote',
    gap_analysis: [],
    ...overrides,
  };
}

describe('runRoleDiscovery', () => {
  let runId: number;

  beforeEach(() => {
    runId = insertDiscoveryRun('roles');
  });

  it('scores new postings and writes them as discovered roles', async () => {
    const companies = [makeCompany()];
    const postings = [makePosting(), makePosting({ url: 'https://example.com/2', title: 'Researcher' })];

    await runRoleDiscovery(runId, {
      getCompanies: () => companies,
      fetchPostings: async () => postings,
      scorePosting: async () => makeScoring(),
    });

    const run = getDiscoveryRun(runId);
    expect(run?.status).toBe('done');
    expect(run?.companies_checked).toBe(1);
    expect(run?.postings_found).toBe(2);
    expect(run?.postings_new).toBe(2);
    expect(run?.postings_scored).toBe(2);
    expect(run?.current_company).toBeNull();

    const roles = getAllRoles();
    expect(roles).toHaveLength(2);
    expect(roles.every((r) => r.source === 'discovered')).toBe(true);
    expect(roles.every((r) => r.discovered_by_run_id === runId)).toBe(true);
    expect(roles.every((r) => r.status === 'New')).toBe(true);
  });

  it('dedupes against existing role URLs', async () => {
    // Pre-insert a role manually with the same URL
    insertRole({
      title: 'Design Engineer',
      company: 'Anthropic',
      url: 'https://job-boards.greenhouse.io/anthropic/jobs/1',
      ai_scores: makeAiScores(),
      ai_recommendation: 'apply',
      source: 'manual',
    });

    const posting = makePosting(); // same URL
    let scoringCalls = 0;

    await runRoleDiscovery(runId, {
      getCompanies: () => [makeCompany()],
      fetchPostings: async () => [posting],
      scorePosting: async () => {
        scoringCalls++;
        return makeScoring();
      },
    });

    const run = getDiscoveryRun(runId);
    expect(run?.postings_found).toBe(1);
    expect(run?.postings_new).toBe(0);
    expect(run?.postings_scored).toBe(0);
    expect(scoringCalls).toBe(0); // dedup prevents the scoring call
    expect(getAllRoles()).toHaveLength(1); // still only the original
  });

  it('continues past a company whose adapter throws', async () => {
    const companies = [
      makeCompany({ id: 1, name: 'Broken', ats_slug: 'broken' }),
      makeCompany({ id: 2, name: 'Working', ats_slug: 'working' }),
    ];

    const fetchPostings = vi.fn(async (_p: AtsProvider, slug: string) => {
      if (slug === 'broken') throw new Error('API 500');
      return [makePosting({ url: 'https://example.com/working-1', company: 'Working' })];
    });

    await runRoleDiscovery(runId, {
      getCompanies: () => companies,
      fetchPostings,
      scorePosting: async () => makeScoring(),
    });

    const run = getDiscoveryRun(runId);
    expect(run?.status).toBe('done');
    expect(run?.companies_checked).toBe(2);
    expect(run?.postings_scored).toBe(1);

    // Error should be in the log
    const errorEntry = run?.log.find((e) => e.level === 'error');
    expect(errorEntry?.msg).toContain('Broken');
    expect(errorEntry?.msg).toContain('API 500');
  });

  it('continues past a posting that fails to score', async () => {
    let scoringAttempts = 0;
    await runRoleDiscovery(runId, {
      getCompanies: () => [makeCompany()],
      fetchPostings: async () => [
        makePosting({ url: 'https://example.com/1', title: 'Fails' }),
        makePosting({ url: 'https://example.com/2', title: 'Works' }),
      ],
      scorePosting: async () => {
        scoringAttempts++;
        if (scoringAttempts === 1) throw new Error('scoring failed');
        return makeScoring();
      },
    });

    const run = getDiscoveryRun(runId);
    expect(run?.postings_scored).toBe(1);
    expect(run?.status).toBe('done');

    const warnEntry = run?.log.find((e) => e.level === 'warn');
    expect(warnEntry?.msg).toContain('Fails');
  });

  it('marks the run done when no companies have ATS configured', async () => {
    await runRoleDiscovery(runId, {
      getCompanies: () => [],
      fetchPostings: async () => [],
      scorePosting: async () => makeScoring(),
    });

    const run = getDiscoveryRun(runId);
    expect(run?.status).toBe('done');
    expect(run?.companies_checked).toBe(0);

    const warnEntry = run?.log.find((e) => e.level === 'warn');
    expect(warnEntry?.msg).toContain('No companies');
  });

  it('marks run as error when every new posting fails to score (silent failure detection)', async () => {
    await runRoleDiscovery(runId, {
      getCompanies: () => [makeCompany()],
      fetchPostings: async () => [
        makePosting({ url: 'https://example.com/1', title: 'A' }),
        makePosting({ url: 'https://example.com/2', title: 'B' }),
        makePosting({ url: 'https://example.com/3', title: 'C' }),
      ],
      scorePosting: async () => {
        throw new Error('ANTHROPIC_API_KEY not set');
      },
    });

    const run = getDiscoveryRun(runId);
    expect(run?.status).toBe('error');
    expect(run?.postings_new).toBe(3);
    expect(run?.postings_scored).toBe(0);
    expect(run?.error).toContain('Scored 0 of 3');
    expect(run?.error).toContain('ANTHROPIC_API_KEY');
  });

  it('still marks run as done when no postings were new (no silent failure false-positive)', async () => {
    // Pre-insert a role so the fetched posting dedupes
    insertRole({
      title: 'Existing',
      company: 'Anthropic',
      url: 'https://example.com/existing',
      ai_scores: makeAiScores(),
      ai_recommendation: 'apply',
    });

    await runRoleDiscovery(runId, {
      getCompanies: () => [makeCompany()],
      fetchPostings: async () => [
        makePosting({ url: 'https://example.com/existing' }),
      ],
      scorePosting: async () => makeScoring(),
    });

    const run = getDiscoveryRun(runId);
    expect(run?.status).toBe('done'); // not 'error' — nothing to score is legit
    expect(run?.postings_new).toBe(0);
    expect(run?.postings_scored).toBe(0);
    expect(run?.error).toBeNull();
  });

  it('honors a mid-run cancellation', async () => {
    let call = 0;
    const companies = [
      makeCompany({ id: 1, name: 'A', ats_slug: 'a' }),
      makeCompany({ id: 2, name: 'B', ats_slug: 'b' }),
      makeCompany({ id: 3, name: 'C', ats_slug: 'c' }),
    ];

    await runRoleDiscovery(runId, {
      getCompanies: () => companies,
      fetchPostings: async () => {
        call++;
        // After first company, user cancels via the runs row
        if (call === 1) {
          updateDiscoveryRun(runId, { status: 'cancelled' });
        }
        return [];
      },
      scorePosting: async () => makeScoring(),
    });

    const run = getDiscoveryRun(runId);
    expect(run?.status).toBe('cancelled');
    expect(run?.companies_checked).toBe(1); // only the first
  });
});
