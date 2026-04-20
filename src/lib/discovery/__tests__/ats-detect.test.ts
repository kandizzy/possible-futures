import { describe, it, expect } from 'vitest';
import { detectAtsFromUrl } from '../ats/detect';

describe('detectAtsFromUrl', () => {
  it('returns null for empty input', () => {
    expect(detectAtsFromUrl('')).toBeNull();
    expect(detectAtsFromUrl(null)).toBeNull();
    expect(detectAtsFromUrl(undefined)).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(detectAtsFromUrl('not a url')).toBeNull();
  });

  it('detects Greenhouse from boards.greenhouse.io', () => {
    expect(detectAtsFromUrl('https://boards.greenhouse.io/anthropic')).toEqual({
      provider: 'greenhouse',
      slug: 'anthropic',
    });
  });

  it('detects Greenhouse from job-boards.greenhouse.io', () => {
    expect(
      detectAtsFromUrl('https://job-boards.greenhouse.io/anthropic/jobs/5101832008'),
    ).toEqual({ provider: 'greenhouse', slug: 'anthropic' });
  });

  it('detects Greenhouse from the direct API URL', () => {
    expect(
      detectAtsFromUrl('https://boards-api.greenhouse.io/v1/boards/anthropic/jobs'),
    ).toEqual({ provider: 'greenhouse', slug: 'anthropic' });
  });

  it('detects Lever from jobs.lever.co', () => {
    expect(detectAtsFromUrl('https://jobs.lever.co/figma')).toEqual({
      provider: 'lever',
      slug: 'figma',
    });
  });

  it('detects Lever from api.lever.co postings URL', () => {
    expect(detectAtsFromUrl('https://api.lever.co/v0/postings/figma?mode=json')).toEqual({
      provider: 'lever',
      slug: 'figma',
    });
  });

  it('detects Ashby from jobs.ashbyhq.com', () => {
    expect(detectAtsFromUrl('https://jobs.ashbyhq.com/linear/some-posting')).toEqual({
      provider: 'ashby',
      slug: 'linear',
    });
  });

  it('detects Workable from apply.workable.com', () => {
    expect(detectAtsFromUrl('https://apply.workable.com/teenage-engineering/')).toEqual({
      provider: 'workable',
      slug: 'teenage-engineering',
    });
  });

  it('returns null for non-ATS careers pages', () => {
    expect(detectAtsFromUrl('https://anthropic.com/careers')).toBeNull();
    expect(detectAtsFromUrl('https://google.com/careers/')).toBeNull();
    expect(detectAtsFromUrl('https://example.com')).toBeNull();
  });

  it('ignores query strings and fragments', () => {
    expect(
      detectAtsFromUrl('https://boards.greenhouse.io/anthropic?foo=bar#gid=123'),
    ).toEqual({ provider: 'greenhouse', slug: 'anthropic' });
  });
});
