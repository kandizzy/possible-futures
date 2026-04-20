import { describe, it, expect, vi } from 'vitest';
import { evaluatePosting } from '@/actions/evaluate';
import { getAllRoles } from '@/lib/queries/roles';
import { makeAiScores } from '@/test/db-helper';
import type { ScoringResponse } from '@/lib/types';

// Mock the AI and fetcher modules
vi.mock('@/lib/ai/scoring', () => ({
  scorePosting: vi.fn(),
}));

vi.mock('@/lib/parsers/posting', () => ({
  fetchPostingText: vi.fn(),
}));

// Import mocked modules so we can control their behavior
import { scorePosting } from '@/lib/ai/scoring';
import { fetchPostingText } from '@/lib/parsers/posting';

const mockScore = scorePosting as ReturnType<typeof vi.fn>;
const mockFetch = fetchPostingText as ReturnType<typeof vi.fn>;

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
}

function makeScoringResponse(overrides?: Partial<ScoringResponse>): ScoringResponse {
  return {
    scores: makeAiScores(),
    total: 12,
    recommendation: 'apply',
    recommended_resume_version: 'B',
    resume_version_rationale: 'Good for makers',
    signal_words_found: ['creative tech'],
    red_flags_found: [],
    fit_summary: 'Strong fit',
    calibration_notes: '',
    role_title: 'Design Engineer',
    company: 'TestCo',
    salary_range: '$150-200k',
    location: 'Remote',
    gap_analysis: [],
    ...overrides,
  };
}

describe('evaluatePosting', () => {
  it('rejects when both URL and pasted text are empty', async () => {
    const res = await evaluatePosting(makeFormData({ url: '', posting_text: '' }));
    expect(res.success).toBe(false);
    expect(res.error).toContain('Provide a URL');
  });

  it('uses pasted text directly without fetching', async () => {
    const scoring = makeScoringResponse();
    mockScore.mockResolvedValueOnce(scoring);

    const res = await evaluatePosting(makeFormData({ url: '', posting_text: 'We are looking for a design engineer...' }));
    expect(res.success).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockScore).toHaveBeenCalledWith('We are looking for a design engineer...');
  });

  it('fetches URL when no pasted text', async () => {
    mockFetch.mockResolvedValueOnce('A'.repeat(200));
    mockScore.mockResolvedValueOnce(makeScoringResponse());

    const res = await evaluatePosting(makeFormData({ url: 'https://example.com/job', posting_text: '' }));
    expect(res.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/job');
  });

  it('rejects short fetched text', async () => {
    mockFetch.mockResolvedValueOnce('Too short');

    const res = await evaluatePosting(makeFormData({ url: 'https://example.com/job', posting_text: '' }));
    expect(res.success).toBe(false);
    expect(res.error).toContain('very little text');
  });

  it('returns error when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const res = await evaluatePosting(makeFormData({ url: 'https://example.com', posting_text: '' }));
    expect(res.success).toBe(false);
    expect(res.error).toContain('Could not fetch URL');
  });

  it('inserts role on success and returns roleId', async () => {
    mockScore.mockResolvedValueOnce(makeScoringResponse());

    const res = await evaluatePosting(makeFormData({ posting_text: 'Long enough posting text '.repeat(10) }));
    expect(res.success).toBe(true);
    expect(res.roleId).toBeGreaterThan(0);

    const roles = getAllRoles();
    expect(roles).toHaveLength(1);
    expect(roles[0].title).toBe('Design Engineer');
    expect(roles[0].company).toBe('TestCo');
  });

  it('returns API key error for ANTHROPIC_API_KEY message', async () => {
    mockScore.mockRejectedValueOnce(new Error('ANTHROPIC_API_KEY not set'));

    const res = await evaluatePosting(makeFormData({ posting_text: 'Some job posting text here' }));
    expect(res.success).toBe(false);
    expect(res.error).toContain('ANTHROPIC_API_KEY');
  });

  it('returns generic scoring error for other exceptions', async () => {
    mockScore.mockRejectedValueOnce(new Error('Model overloaded'));

    const res = await evaluatePosting(makeFormData({ posting_text: 'Some job posting text here' }));
    expect(res.success).toBe(false);
    expect(res.error).toContain('Scoring failed');
  });
});
