import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildResumeFromBase } from '@/lib/resume-builder';
import fs from 'fs';

describe('buildResumeFromBase', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('replaces ## Summary section with AI-generated summary', () => {
    const baseResume = `# Jane Doe

## Summary

Old summary goes here.

## Experience

Some experience.
`;
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(baseResume);

    const result = buildResumeFromBase('A', 'New AI-generated summary');
    expect(result).toContain('New AI-generated summary');
    expect(result).not.toContain('Old summary goes here');
    expect(result).toContain('## Experience');
  });

  it('preserves content before and after Summary section', () => {
    const baseResume = `# Header

## Summary

Old summary.

## Experience

Jobs here.

## Education

Schools here.
`;
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(baseResume);

    const result = buildResumeFromBase('B', 'Tailored summary');
    expect(result).toContain('# Header');
    expect(result).toContain('Jobs here.');
    expect(result).toContain('Schools here.');
  });

  it('inserts Summary section when none exists', () => {
    const baseResume = `# Header

## Experience

Some jobs.
`;
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(baseResume);

    const result = buildResumeFromBase('C', 'Inserted summary');
    expect(result).toContain('## Summary');
    expect(result).toContain('Inserted summary');
    expect(result).toContain('## Experience');
  });

  it('returns empty string when file does not exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    expect(buildResumeFromBase('D', 'Any summary')).toBe('');
  });
});
