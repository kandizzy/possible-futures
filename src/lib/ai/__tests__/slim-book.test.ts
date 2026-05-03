import { describe, it, expect } from 'vitest';
import { extractRoleList, buildSlimBook } from '@/lib/ai/slim-book';

const SAMPLE_BOOK = `# Career Book

## Through-line
Designing tools that feel like instruments.

## Current Situation
Looking for a Staff Design Engineer role.

## Career Timeline

### Senior Engineer · Anthropic
_2024 – Present_

Building dev tools.

### Founder · STEADY
_2020 – 2023_

Open-source CSS framework.

### Lecturer · SVA
_2019 – 2024_

Taught interaction design.

### Engineer · Eyeo
_2016 – 2019_

Generative software.

## Independent Projects

### Keyboard Garden
A browser synth.

## Recognition
- Featured on It's Nice That
`;

describe('extractRoleList', () => {
  it('returns one entry per role with heading + dates', () => {
    const roles = extractRoleList(SAMPLE_BOOK);
    expect(roles).toHaveLength(4);
    expect(roles[0].heading).toBe('Senior Engineer · Anthropic');
    expect(roles[0].dates).toBe('2024 – Present');
    expect(roles[3].heading).toBe('Engineer · Eyeo');
  });

  it('returns indices 0..n-1 in compile order', () => {
    const roles = extractRoleList(SAMPLE_BOOK);
    expect(roles.map((r) => r.index)).toEqual([0, 1, 2, 3]);
  });

  it('returns empty array when book has no Career Timeline', () => {
    const noTimeline = '# Book\n## Through-line\nA thread.\n## Recognition\nThings.';
    expect(extractRoleList(noTimeline)).toEqual([]);
  });
});

describe('buildSlimBook', () => {
  it('keeps only the roles whose indices were selected', () => {
    const slim = buildSlimBook(SAMPLE_BOOK, [0, 2]);
    expect(slim).toContain('### Senior Engineer · Anthropic');
    expect(slim).toContain('### Lecturer · SVA');
    expect(slim).not.toContain('### Founder · STEADY');
    expect(slim).not.toContain('### Engineer · Eyeo');
  });

  it('preserves sections outside Career Timeline verbatim', () => {
    const slim = buildSlimBook(SAMPLE_BOOK, [0]);
    expect(slim).toContain('## Through-line');
    expect(slim).toContain('Designing tools that feel like instruments.');
    expect(slim).toContain('## Current Situation');
    expect(slim).toContain('## Independent Projects');
    expect(slim).toContain('### Keyboard Garden');
    expect(slim).toContain('## Recognition');
    expect(slim).toContain("Featured on It's Nice That");
  });

  it('keeps the Career Timeline header even when no roles selected', () => {
    const slim = buildSlimBook(SAMPLE_BOOK, []);
    expect(slim).toContain('## Career Timeline');
    expect(slim).toContain('roles trimmed for relevance');
    // The other sections should still be intact
    expect(slim).toContain('## Independent Projects');
  });

  it('returns the original book when there is no Career Timeline', () => {
    const noTimeline = '# Book\n## Through-line\nA thread.\n## Recognition\nThings.';
    expect(buildSlimBook(noTimeline, [0, 1])).toBe(noTimeline);
  });

  it('ignores out-of-range indices', () => {
    const slim = buildSlimBook(SAMPLE_BOOK, [0, 99, 100]);
    expect(slim).toContain('### Senior Engineer · Anthropic');
    expect(slim).not.toContain('### Founder · STEADY');
    // Should not include any phantom content for index 99
    expect(slim).not.toContain('99');
  });

  it('preserves the order roles appear in the original book', () => {
    const slim = buildSlimBook(SAMPLE_BOOK, [3, 0]); // selector returned reversed
    const seniorAt = slim.indexOf('Senior Engineer');
    const eyeoAt = slim.indexOf('Engineer · Eyeo');
    // Original order in slim should still be Senior first, Eyeo last
    expect(seniorAt).toBeLessThan(eyeoAt);
  });
});
