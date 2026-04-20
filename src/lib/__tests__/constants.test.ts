import { describe, it, expect } from 'vitest';
import {
  DIMENSION_LABELS,
  RECOMMENDATION_STYLES,
  RECOMMENDATION_LABELS,
  ROLE_STATUS_COLORS,
  APP_STATUS_COLORS,
} from '@/lib/constants';

describe('DIMENSION_LABELS', () => {
  it('has exactly 6 dimensions', () => {
    expect(Object.keys(DIMENSION_LABELS)).toHaveLength(6);
  });

  it('covers all dimensions', () => {
    expect(DIMENSION_LABELS).toHaveProperty('want');
    expect(DIMENSION_LABELS).toHaveProperty('can');
    expect(DIMENSION_LABELS).toHaveProperty('grow');
    expect(DIMENSION_LABELS).toHaveProperty('pay');
    expect(DIMENSION_LABELS).toHaveProperty('team');
    expect(DIMENSION_LABELS).toHaveProperty('impact');
  });
});

describe('RECOMMENDATION_STYLES', () => {
  it('has styles for apply, stretch, skip', () => {
    expect(RECOMMENDATION_STYLES).toHaveProperty('apply');
    expect(RECOMMENDATION_STYLES).toHaveProperty('stretch');
    expect(RECOMMENDATION_STYLES).toHaveProperty('skip');
  });
});

describe('RECOMMENDATION_LABELS', () => {
  it('has labels for apply, stretch, skip', () => {
    expect(RECOMMENDATION_LABELS).toHaveProperty('apply');
    expect(RECOMMENDATION_LABELS).toHaveProperty('stretch');
    expect(RECOMMENDATION_LABELS).toHaveProperty('skip');
  });

  it('labels are non-empty strings', () => {
    for (const val of Object.values(RECOMMENDATION_LABELS)) {
      expect(val).toBeTruthy();
      expect(typeof val).toBe('string');
    }
  });
});

describe('ROLE_STATUS_COLORS', () => {
  const EXPECTED_STATUSES = ['New', 'Applied', 'Interviewing', 'Rejected', 'Ghosted', 'Withdrawn', 'Offer', 'Skipped'];

  it('has colors for all 8 statuses', () => {
    for (const status of EXPECTED_STATUSES) {
      expect(ROLE_STATUS_COLORS).toHaveProperty(status);
    }
  });
});

describe('APP_STATUS_COLORS', () => {
  const EXPECTED = ['Submitted', 'Phone Screen', 'Interview', 'Take Home', 'Offer', 'Rejected', 'Withdrawn'];

  it('has colors for all application statuses', () => {
    for (const status of EXPECTED) {
      expect(APP_STATUS_COLORS).toHaveProperty(status);
    }
  });
});
