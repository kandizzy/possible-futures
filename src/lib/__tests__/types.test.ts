import { describe, it, expect } from 'vitest';
import { getTotalScore, getScoreColor, getScoreBgColor } from '@/lib/types';
import type { AiScores, MyScores } from '@/lib/types';

describe('getTotalScore', () => {
  it('sums all 6 AiScores dimensions', () => {
    const scores: AiScores = {
      want: { score: 3, rationale: '' },
      can: { score: 2, rationale: '' },
      grow: { score: 1, rationale: '' },
      pay: { score: 3, rationale: '' },
      team: { score: 2, rationale: '' },
      impact: { score: 1, rationale: '' },
    };
    expect(getTotalScore(scores)).toBe(12);
  });

  it('sums MyScores plain numbers', () => {
    const scores: MyScores = { want: 3, can: 2, grow: 1, pay: 3, team: 2, impact: 1 };
    expect(getTotalScore(scores)).toBe(12);
  });

  it('skips undefined dimensions in MyScores', () => {
    const scores: MyScores = { want: 3, can: 2 };
    expect(getTotalScore(scores)).toBe(5);
  });

  it('returns 0 for empty MyScores', () => {
    expect(getTotalScore({} as MyScores)).toBe(0);
  });

  it('returns 0 for all-zero AiScores', () => {
    const scores: AiScores = {
      want: { score: 0, rationale: '' },
      can: { score: 0, rationale: '' },
      grow: { score: 0, rationale: '' },
      pay: { score: 0, rationale: '' },
      team: { score: 0, rationale: '' },
      impact: { score: 0, rationale: '' },
    };
    expect(getTotalScore(scores)).toBe(0);
  });

  it('returns 18 for all-max AiScores', () => {
    const scores: AiScores = {
      want: { score: 3, rationale: '' },
      can: { score: 3, rationale: '' },
      grow: { score: 3, rationale: '' },
      pay: { score: 3, rationale: '' },
      team: { score: 3, rationale: '' },
      impact: { score: 3, rationale: '' },
    };
    expect(getTotalScore(scores)).toBe(18);
  });
});

describe('getScoreColor', () => {
  it('returns stamp (vermillion accent) for total >= 15', () => {
    expect(getScoreColor(15)).toBe('text-stamp');
    expect(getScoreColor(18)).toBe('text-stamp');
  });

  it('returns ink (neutral) for total 12-14', () => {
    expect(getScoreColor(12)).toBe('text-ink');
    expect(getScoreColor(14)).toBe('text-ink');
  });

  it('returns muted ink-3 for total < 12', () => {
    expect(getScoreColor(11)).toBe('text-ink-3');
    expect(getScoreColor(0)).toBe('text-ink-3');
  });
});

describe('getScoreBgColor', () => {
  it('returns a tinted stamp background for total >= 15', () => {
    expect(getScoreBgColor(15)).toBe('bg-stamp/5');
  });

  it('returns empty class for total 12-14', () => {
    expect(getScoreBgColor(12)).toBe('');
  });

  it('returns empty class for total < 12', () => {
    expect(getScoreBgColor(11)).toBe('');
  });
});
