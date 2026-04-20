import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseScoringResponse, scorePosting } from '@/lib/ai/scoring';
import { makeAiScores } from '@/test/db-helper';
import { upsertSourceFile } from '@/lib/queries/source-files';
import { upsertCompassConfig } from '@/lib/queries/compass';
import type { ScoringResponse } from '@/lib/types';

// Mock the Anthropic client + CLI so scorePosting can run without real keys
const mockCreate = vi.fn();
vi.mock('@/lib/ai/client', () => ({
  getAnthropicClient: () => ({ messages: { create: mockCreate } }),
  getModel: () => 'claude-sonnet-4-6',
}));
vi.mock('@/lib/ai/cli', () => ({
  claudeCli: vi.fn(),
}));

function makeValidResponse(overrides?: Partial<ScoringResponse>): string {
  const response: ScoringResponse = {
    scores: makeAiScores({ want: { score: 3, rationale: 'excited' } }),
    total: 99, // deliberately wrong — should be recalculated
    recommendation: 'apply',
    recommended_resume_version: 'B',
    resume_version_rationale: 'Good for makers',
    signal_words_found: ['design systems'],
    red_flags_found: [],
    fit_summary: 'Strong fit overall',
    calibration_notes: '',
    role_title: 'Design Engineer',
    company: 'TestCo',
    salary_range: '$150-200k',
    location: 'Remote',
    gap_analysis: [{ gap: 'Go', why_it_matters: 'backend', project_ideas: ['learn'], existing_projects: [] }],
    ...overrides,
  };
  return JSON.stringify(response);
}

describe('parseScoringResponse', () => {
  it('parses valid response', () => {
    const result = parseScoringResponse(makeValidResponse());
    expect(result.recommendation).toBe('apply');
    expect(result.fit_summary).toBe('Strong fit overall');
    expect(result.scores.want.score).toBe(3);
  });

  it('recalculates total from actual dimension scores', () => {
    // All dimensions default to score=2 from makeAiScores, except want=3
    // Expected: 3 + 2 + 2 + 2 + 2 + 2 = 13
    const result = parseScoringResponse(makeValidResponse());
    expect(result.total).toBe(13);
  });

  it('defaults gap_analysis to [] when missing', () => {
    const response = makeValidResponse();
    const parsed = JSON.parse(response);
    delete parsed.gap_analysis;
    const result = parseScoringResponse(JSON.stringify(parsed));
    expect(result.gap_analysis).toEqual([]);
  });

  it('throws when scores field is missing', () => {
    const response = JSON.stringify({
      recommendation: 'apply',
      fit_summary: 'test',
    });
    expect(() => parseScoringResponse(response)).toThrow('missing required fields');
  });

  it('throws when recommendation is missing', () => {
    const response = JSON.stringify({
      scores: makeAiScores(),
      fit_summary: 'test',
    });
    expect(() => parseScoringResponse(response)).toThrow('missing required fields');
  });

  it('throws when fit_summary is missing', () => {
    const response = JSON.stringify({
      scores: makeAiScores(),
      recommendation: 'apply',
    });
    expect(() => parseScoringResponse(response)).toThrow('missing required fields');
  });

  it('handles code-fenced JSON', () => {
    const json = makeValidResponse();
    const result = parseScoringResponse('```json\n' + json + '\n```');
    expect(result.recommendation).toBe('apply');
  });
});

describe('scorePosting — prompt caching contract', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: makeValidResponse() }],
      usage: {
        input_tokens: 1000,
        output_tokens: 500,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    });

    // Seed a compass config so buildScoringStablePrefix has something to work with
    upsertCompassConfig({
      signal_words: ['craft', 'design engineer'],
      red_flag_words: ['rockstar'],
      compensation_floor: 150000,
    });
    upsertSourceFile('PROJECT_BOOK', '# Test book\n\nSome content.');
    upsertSourceFile('JOB_SEARCH_COMPASS.md', '# Test compass\n\n## Signal Words in Job Postings\n- "craft"');
    upsertSourceFile('APPLICATION_PLAYBOOK.md', '# Test playbook');
  });

  it('marks the stable prefix with cache_control ephemeral', async () => {
    await scorePosting('Some job posting text here', 'api');

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const call = mockCreate.mock.calls[0][0];

    // messages should be one user message with an array content
    expect(call.messages).toHaveLength(1);
    expect(call.messages[0].role).toBe('user');
    expect(Array.isArray(call.messages[0].content)).toBe(true);

    // First block = stable prefix, tagged with cache_control
    const blocks = call.messages[0].content;
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe('text');
    expect(blocks[0].cache_control).toEqual({ type: 'ephemeral' });

    // Second block = volatile posting, no cache_control
    expect(blocks[1].type).toBe('text');
    expect(blocks[1].cache_control).toBeUndefined();
    expect(blocks[1].text).toContain('JOB POSTING TO EVALUATE');
    expect(blocks[1].text).toContain('Some job posting text here');
  });

  it('stable prefix contains the Book, Compass, and Playbook content', async () => {
    await scorePosting('another posting', 'api');
    const prefix = mockCreate.mock.calls[0][0].messages[0].content[0].text as string;

    expect(prefix).toContain('JOB SEARCH COMPASS');
    expect(prefix).toContain('CAREER HISTORY');
    expect(prefix).toContain('APPLICATION PLAYBOOK');
    expect(prefix).toContain('INSTRUCTIONS');
    // Prefix should NOT contain the volatile posting text
    expect(prefix).not.toContain('another posting');
  });
});
