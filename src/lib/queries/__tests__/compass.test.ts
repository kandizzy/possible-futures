import { describe, it, expect } from 'vitest';
import {
  getCompassConfig,
  upsertCompassConfig,
  getAiMode,
  setAiMode,
  getMaterialsMode,
  setMaterialsMode,
} from '@/lib/queries/compass';
import { seedCompassConfig } from '@/test/db-helper';
import { getDb } from '@/lib/db';

describe('getCompassConfig', () => {
  it('returns null when no config row exists', () => {
    expect(getCompassConfig()).toBeNull();
  });

  it('deserializes signal_words and red_flag_words from JSON', () => {
    seedCompassConfig(getDb(), {
      signal_words: ['creative tech', 'design systems'],
      red_flag_words: ['blockchain'],
    });
    const config = getCompassConfig()!;
    expect(config.signal_words).toEqual(['creative tech', 'design systems']);
    expect(config.red_flag_words).toEqual(['blockchain']);
  });

  it('returns ai_mode and materials_mode with defaults', () => {
    seedCompassConfig(getDb());
    const config = getCompassConfig()!;
    expect(config.ai_mode).toBe('api');
    expect(config.materials_mode).toBe('summary');
  });
});

describe('upsertCompassConfig', () => {
  it('updates signal words, red flag words, and compensation floor', () => {
    seedCompassConfig(getDb());
    upsertCompassConfig({
      signal_words: ['new signal'],
      red_flag_words: ['new flag'],
      compensation_floor: 200000,
    });
    const config = getCompassConfig()!;
    expect(config.signal_words).toEqual(['new signal']);
    expect(config.red_flag_words).toEqual(['new flag']);
    expect(config.compensation_floor).toBe(200000);
  });
});

describe('getAiMode + setAiMode', () => {
  it('defaults to api when no config', () => {
    expect(getAiMode()).toBe('api');
  });

  it('changes mode to cli', () => {
    seedCompassConfig(getDb());
    setAiMode('cli');
    expect(getAiMode()).toBe('cli');
  });
});

describe('getMaterialsMode + setMaterialsMode', () => {
  it('defaults to summary when no config', () => {
    expect(getMaterialsMode()).toBe('summary');
  });

  it('changes mode to full', () => {
    seedCompassConfig(getDb());
    setMaterialsMode('full');
    expect(getMaterialsMode()).toBe('full');
  });
});
