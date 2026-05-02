import { describe, it, expect } from 'vitest';
import { getAtsBoardUrl } from '@/lib/ats/board-url';
import { detectAtsFromUrl } from '@/lib/discovery/ats/detect';

describe('getAtsBoardUrl', () => {
  it('greenhouse → job-boards.greenhouse.io', () => {
    expect(getAtsBoardUrl('greenhouse', 'anthropic')).toBe(
      'https://job-boards.greenhouse.io/anthropic',
    );
  });

  it('lever → jobs.lever.co', () => {
    expect(getAtsBoardUrl('lever', 'figma')).toBe('https://jobs.lever.co/figma');
  });

  it('ashby → jobs.ashbyhq.com', () => {
    expect(getAtsBoardUrl('ashby', 'linear')).toBe('https://jobs.ashbyhq.com/linear');
  });

  it('workable → apply.workable.com', () => {
    expect(getAtsBoardUrl('workable', 'teenage-engineering')).toBe(
      'https://apply.workable.com/teenage-engineering',
    );
  });

  it('encodes slugs with special characters', () => {
    expect(getAtsBoardUrl('greenhouse', 'foo bar')).toBe(
      'https://job-boards.greenhouse.io/foo%20bar',
    );
  });

  it('round-trips through detectAtsFromUrl for every provider', () => {
    for (const [provider, slug] of [
      ['greenhouse', 'anthropic'],
      ['lever', 'figma'],
      ['ashby', 'linear'],
      ['workable', 'teenage-engineering'],
    ] as const) {
      const url = getAtsBoardUrl(provider, slug);
      const detected = detectAtsFromUrl(url);
      expect(detected).toEqual({ provider, slug });
    }
  });
});
