import { describe, it, expect } from 'vitest';
import {
  getSourceFile,
  getAllSourceFiles,
  upsertSourceFile,
  getResumeVersionLabels,
  getVersionLabelMap,
} from '@/lib/queries/source-files';

describe('upsertSourceFile + getSourceFile', () => {
  it('inserts and retrieves by filename', () => {
    upsertSourceFile('test.md', 'Hello world');
    const file = getSourceFile('test.md')!;
    expect(file.filename).toBe('test.md');
    expect(file.content).toBe('Hello world');
  });

  it('returns null for unknown filename', () => {
    expect(getSourceFile('nope.md')).toBeNull();
  });

  it('updates content on conflict (same filename)', () => {
    upsertSourceFile('test.md', 'Version 1');
    upsertSourceFile('test.md', 'Version 2');
    expect(getSourceFile('test.md')!.content).toBe('Version 2');
  });
});

describe('getAllSourceFiles', () => {
  it('returns files ordered by filename', () => {
    upsertSourceFile('z.md', 'Z');
    upsertSourceFile('a.md', 'A');
    const files = getAllSourceFiles();
    expect(files[0].filename).toBe('a.md');
    expect(files[1].filename).toBe('z.md');
  });
});

describe('getResumeVersionLabels', () => {
  it('returns empty object when no playbook loaded', () => {
    expect(getResumeVersionLabels()).toEqual({});
  });

  it('parses Version headers from playbook content', () => {
    upsertSourceFile('APPLICATION_PLAYBOOK.md', `
# Playbook

## Role-Type Emphasis Guide

### Version A: The Leader
Content about leadership...

### Version B: The Maker
Content about making...

### Version C: The Hybrid
Content about both...

### Version D: The Interaction Designer
Content about design...
`);
    const labels = getResumeVersionLabels();
    expect(labels).toEqual({
      A: 'The Leader',
      B: 'The Maker',
      C: 'The Hybrid',
      D: 'The Interaction Designer',
    });
  });
});

describe('getVersionLabelMap', () => {
  it('formats as "X: Label"', () => {
    upsertSourceFile('APPLICATION_PLAYBOOK.md', `### Version A: The Leader\n### Version B: The Maker`);
    const map = getVersionLabelMap();
    expect(map['A']).toBe('A: The Leader');
    expect(map['B']).toBe('B: The Maker');
  });
});
