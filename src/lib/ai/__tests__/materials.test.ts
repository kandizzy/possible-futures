import { describe, it, expect } from 'vitest';
import { parseMaterialsResponse, extractSection, extractRules } from '@/lib/ai/materials';

describe('parseMaterialsResponse', () => {
  it('parses valid response', () => {
    const json = JSON.stringify({
      cover_letter: 'Dear hiring manager...',
      resume: '# Resume\n...',
      resume_summary: 'Experienced engineer...',
      resume_version: 'B',
      version_rationale: 'Good for makers',
      key_projects_to_emphasize: ['Project A'],
      projects_to_compress: ['Project B'],
    });
    const result = parseMaterialsResponse(json, 'full');
    expect(result.cover_letter).toBe('Dear hiring manager...');
    expect(result.resume_version).toBe('B');
  });

  it('throws when cover_letter is missing', () => {
    const json = JSON.stringify({
      resume_summary: 'Summary',
      resume_version: 'A',
    });
    expect(() => parseMaterialsResponse(json, 'summary')).toThrow('missing required fields');
  });

  it('throws when resume_summary is missing', () => {
    const json = JSON.stringify({
      cover_letter: 'Letter',
      resume_version: 'A',
    });
    expect(() => parseMaterialsResponse(json, 'summary')).toThrow('missing required fields');
  });

  it('defaults resume to empty string when not present (summary mode)', () => {
    const json = JSON.stringify({
      cover_letter: 'Letter',
      resume_summary: 'Summary',
      resume_version: 'A',
      version_rationale: 'test',
      key_projects_to_emphasize: [],
      projects_to_compress: [],
    });
    const result = parseMaterialsResponse(json, 'summary');
    expect(result.resume).toBe('');
  });
});

describe('extractSection', () => {
  const content = `# Doc

## Writing Rules

Rule 1: No em dashes.
Rule 2: Be concise.

## Things to Never Say

Never say "self-taught".

## Education

SVA MFA IxD.
`;

  it('extracts content between matching header and next header', () => {
    const result = extractSection(content, '## Writing Rules');
    expect(result).toContain('Rule 1: No em dashes.');
    expect(result).toContain('Rule 2: Be concise.');
    expect(result).not.toContain('Never say');
  });

  it('returns empty string for missing header', () => {
    expect(extractSection(content, '## Nonexistent')).toBe('');
  });

  it('returns content to end when no following header', () => {
    const result = extractSection(content, '## Education');
    expect(result).toContain('SVA MFA IxD.');
  });
});

describe('extractRules', () => {
  it('extracts rules from Book and Playbook', () => {
    const book = `# Book

## Writing Rules

No em dashes.

## Things to Never Say

Never say self-taught.

## Other Section

Ignore this.
`;
    const playbook = `# Playbook

## Resume Rules

Two pages max.

## Cover Letter Rules

Three paragraphs max.

## Things to Never Do

Use contract in titles.

## Other

Ignore this too.
`;

    const result = extractRules(book, playbook);
    expect(result).toContain('WRITING RULES');
    expect(result).toContain('No em dashes.');
    expect(result).toContain('THINGS TO NEVER SAY');
    expect(result).toContain('RESUME RULES');
    expect(result).toContain('Two pages max.');
    expect(result).toContain('COVER LETTER RULES');
    expect(result).toContain('Three paragraphs max.');
    expect(result).toContain('THINGS TO NEVER DO');
    expect(result).toContain('Use contract in titles.');
  });

  it('returns empty string when no matching sections', () => {
    expect(extractRules('No sections here', 'None here either')).toBe('');
  });
});
