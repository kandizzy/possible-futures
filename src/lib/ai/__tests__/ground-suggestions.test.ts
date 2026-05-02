import { describe, it, expect, vi, beforeEach } from 'vitest';
import { groundSuggestionRationales } from '@/lib/ai/ground-suggestions';
import { upsertSourceFile } from '@/lib/queries/source-files';
import { upsertCompassConfig } from '@/lib/queries/compass';

const mockCreate = vi.fn();
vi.mock('@/lib/ai/client', () => ({
  getAnthropicClient: () => ({ messages: { create: mockCreate } }),
  getModel: () => 'claude-sonnet-4-6',
}));
vi.mock('@/lib/ai/cli', () => ({
  claudeCli: vi.fn(),
}));

function aiResponse(results: { name: string; why_fits: string | null }[]): {
  content: { type: 'text'; text: string }[];
  usage: { input_tokens: number; output_tokens: number };
} {
  return {
    content: [{ type: 'text', text: JSON.stringify({ results }) }],
    usage: { input_tokens: 100, output_tokens: 50 },
  };
}

beforeEach(() => {
  mockCreate.mockReset();
  upsertCompassConfig({ signal_words: ['design'], red_flag_words: [], compensation_floor: 100000 });
  upsertSourceFile('JOB_SEARCH_COMPASS.md', '# Compass\nSignal words: design.');
});

describe('groundSuggestionRationales', () => {
  it('returns empty when given no candidates without calling the AI', async () => {
    const result = await groundSuggestionRationales([]);
    expect(result.results).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns one result per input candidate, preserving order', async () => {
    mockCreate.mockResolvedValue(
      aiResponse([
        { name: 'Acme', why_fits: 'Postings emphasize design fidelity.' },
        { name: 'Beta', why_fits: null },
      ]),
    );
    const result = await groundSuggestionRationales([
      { name: 'Acme', postings: [{ title: 'Design Eng', text: 'Build great UIs.' }] },
      { name: 'Beta', postings: [{ title: 'Sales', text: 'Close enterprise deals.' }] },
    ]);
    expect(result.results).toHaveLength(2);
    expect(result.results[0].name).toBe('Acme');
    expect(result.results[0].why_fits).toBe('Postings emphasize design fidelity.');
    expect(result.results[1].name).toBe('Beta');
    expect(result.results[1].why_fits).toBeNull();
  });

  it('treats whitespace-only why_fits as null', async () => {
    mockCreate.mockResolvedValue(aiResponse([{ name: 'Acme', why_fits: '   ' }]));
    const result = await groundSuggestionRationales([
      { name: 'Acme', postings: [{ title: 'X', text: 'Y' }] },
    ]);
    expect(result.results[0].why_fits).toBeNull();
  });

  it('returns null for candidates the model omitted from its response', async () => {
    mockCreate.mockResolvedValue(aiResponse([{ name: 'Acme', why_fits: 'A fit.' }]));
    const result = await groundSuggestionRationales([
      { name: 'Acme', postings: [{ title: 'X', text: 'Y' }] },
      { name: 'Missing', postings: [{ title: 'X', text: 'Y' }] },
    ]);
    expect(result.results).toHaveLength(2);
    expect(result.results[1].why_fits).toBeNull();
  });

  it('matches model responses case-insensitively', async () => {
    mockCreate.mockResolvedValue(
      aiResponse([{ name: 'acme inc', why_fits: 'Yes' }]),
    );
    const result = await groundSuggestionRationales([
      { name: 'Acme Inc', postings: [{ title: 'X', text: 'Y' }] },
    ]);
    expect(result.results[0].why_fits).toBe('Yes');
  });

  it('throws if the response is missing the results array', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{"foo": "bar"}' }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });
    await expect(
      groundSuggestionRationales([
        { name: 'Acme', postings: [{ title: 'X', text: 'Y' }] },
      ]),
    ).rejects.toThrow(/results.*array/i);
  });
});
