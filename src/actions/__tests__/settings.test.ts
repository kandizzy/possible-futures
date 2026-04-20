import { describe, it, expect } from 'vitest';
import { updateAiMode, updateMaterialsMode, getSettings, updateCompassConfig } from '@/actions/settings';
import { seedCompassConfig } from '@/test/db-helper';
import { getDb } from '@/lib/db';

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
}

describe('updateAiMode', () => {
  it('rejects invalid mode', async () => {
    const res = await updateAiMode(makeFormData({ ai_mode: 'turbo' }));
    expect(res.success).toBe(false);
    expect(res.mode).toBe('api');
  });

  it('accepts api mode', async () => {
    seedCompassConfig(getDb());
    const res = await updateAiMode(makeFormData({ ai_mode: 'api' }));
    expect(res.success).toBe(true);
    expect(res.mode).toBe('api');
  });

  it('accepts cli mode', async () => {
    seedCompassConfig(getDb());
    const res = await updateAiMode(makeFormData({ ai_mode: 'cli' }));
    expect(res.success).toBe(true);
    expect(res.mode).toBe('cli');
  });
});

describe('updateMaterialsMode', () => {
  it('rejects invalid mode', async () => {
    const res = await updateMaterialsMode(makeFormData({ materials_mode: 'turbo' }));
    expect(res.success).toBe(false);
    expect(res.mode).toBe('summary');
  });

  it('accepts full mode', async () => {
    seedCompassConfig(getDb());
    const res = await updateMaterialsMode(makeFormData({ materials_mode: 'full' }));
    expect(res.success).toBe(true);
    expect(res.mode).toBe('full');
  });

  it('accepts summary mode', async () => {
    seedCompassConfig(getDb());
    const res = await updateMaterialsMode(makeFormData({ materials_mode: 'summary' }));
    expect(res.success).toBe(true);
    expect(res.mode).toBe('summary');
  });
});

describe('getSettings', () => {
  it('returns defaults when no compass config exists', async () => {
    const settings = await getSettings();
    expect(settings.ai_mode).toBe('api');
    expect(settings.materials_mode).toBe('summary');
    expect(settings.signal_words).toEqual([]);
    expect(settings.compensation_floor).toBe(150000);
  });

  it('returns saved config', async () => {
    seedCompassConfig(getDb(), {
      signal_words: ['react', 'design'],
      red_flag_words: ['ninja'],
      compensation_floor: 180000,
    });
    const settings = await getSettings();
    expect(settings.signal_words).toEqual(['react', 'design']);
    expect(settings.red_flag_words).toEqual(['ninja']);
    expect(settings.compensation_floor).toBe(180000);
  });
});

describe('updateCompassConfig', () => {
  it('rejects invalid compensation_floor', async () => {
    seedCompassConfig(getDb());
    const res = await updateCompassConfig(makeFormData({
      signal_words: '["test"]',
      red_flag_words: '["bad"]',
      compensation_floor: 'not_a_number',
    }));
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid');
  });

  it('rejects negative compensation_floor', async () => {
    seedCompassConfig(getDb());
    const res = await updateCompassConfig(makeFormData({
      signal_words: '["test"]',
      red_flag_words: '["bad"]',
      compensation_floor: '-1',
    }));
    expect(res.success).toBe(false);
  });

  it('saves and round-trips through getSettings', async () => {
    seedCompassConfig(getDb());
    const res = await updateCompassConfig(makeFormData({
      signal_words: '["creative tech","prototyping"]',
      red_flag_words: '["blockchain"]',
      compensation_floor: '200000',
    }));
    expect(res.success).toBe(true);

    const settings = await getSettings();
    expect(settings.signal_words).toEqual(['creative tech', 'prototyping']);
    expect(settings.red_flag_words).toEqual(['blockchain']);
    expect(settings.compensation_floor).toBe(200000);
  });

  it('rejects invalid JSON for signal_words', async () => {
    seedCompassConfig(getDb());
    const res = await updateCompassConfig(makeFormData({
      signal_words: 'not json',
      red_flag_words: '["ok"]',
      compensation_floor: '150000',
    }));
    expect(res.success).toBe(false);
  });
});
