import { describe, it, expect } from 'vitest';
import { isUnusualTransition } from '@/lib/status-order';

describe('isUnusualTransition', () => {
  it('flags leaving a concluded outcome', () => {
    // The original bug: Rejected -> Ghosted.
    expect(isUnusualTransition('Rejected', 'Ghosted')).toBe(true);
    expect(isUnusualTransition('Offer', 'Interviewing')).toBe(true);
    expect(isUnusualTransition('Withdrawn', 'Applied')).toBe(true);
  });

  it('does not flag changes from open / in-motion states', () => {
    expect(isUnusualTransition('New', 'Applied')).toBe(false);
    expect(isUnusualTransition('Applied', 'Interviewing')).toBe(false);
    expect(isUnusualTransition('Interviewing', 'Offer')).toBe(false);
    expect(isUnusualTransition('Submitted', 'Interview')).toBe(false);
  });

  it('treats Ghosted as limbo — moving in or out is silent', () => {
    // The second bug report: Applied -> Ghosted -> Applied warned on return.
    expect(isUnusualTransition('Applied', 'Ghosted')).toBe(false);
    expect(isUnusualTransition('Ghosted', 'Applied')).toBe(false);
    expect(isUnusualTransition('Ghosted', 'Interviewing')).toBe(false);
    expect(isUnusualTransition('Ghosted', 'Rejected')).toBe(false);
  });

  it('does not flag corrections that step backward through open states', () => {
    expect(isUnusualTransition('Interviewing', 'Applied')).toBe(false);
    expect(isUnusualTransition('Interview', 'Submitted')).toBe(false);
  });

  it('is never unusual when status is unchanged', () => {
    expect(isUnusualTransition('Rejected', 'Rejected')).toBe(false);
    expect(isUnusualTransition('Applied', 'Applied')).toBe(false);
  });
});
