import { describe, it, expect } from 'vitest';
import { getMeta, setMeta, getMetaFlag, setMetaFlag } from '@/lib/queries/meta';

describe('meta', () => {
  it('returns null for unset keys', () => {
    expect(getMeta('does_not_exist')).toBeNull();
  });

  it('schema seeds data_schema_version=1 on a fresh DB', () => {
    expect(getMeta('data_schema_version')).toBe('1');
  });

  it('upserts a value', () => {
    setMeta('seen_v0_2_release', '1');
    expect(getMeta('seen_v0_2_release')).toBe('1');

    setMeta('seen_v0_2_release', '0');
    expect(getMeta('seen_v0_2_release')).toBe('0');
  });

  it('flag helpers round-trip booleans', () => {
    setMetaFlag('banner_dismissed', true);
    expect(getMetaFlag('banner_dismissed')).toBe(true);

    setMetaFlag('banner_dismissed', false);
    expect(getMetaFlag('banner_dismissed')).toBe(false);
  });

  it('treats unset flags as false', () => {
    expect(getMetaFlag('never_set_flag')).toBe(false);
  });
});
