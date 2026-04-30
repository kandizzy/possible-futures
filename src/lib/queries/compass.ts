import { getDb } from '../db';
import { DEFAULT_MODEL } from '../ai/pricing';
import type { CompassConfig, AiMode, MaterialsMode } from '../types';

interface CompassRow {
  id: number;
  signal_words: string;
  red_flag_words: string;
  compensation_floor: number;
  ai_mode: string;
  materials_mode: string;
  reasoning_model: string | null;
  local_base_url: string | null;
  local_model: string | null;
  local_api_key: string | null;
  updated_at: string;
}

export interface LocalConfig {
  base_url: string;
  model: string;
  api_key: string | null;
}

export function getCompassConfig(): CompassConfig | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM compass_config WHERE id = 1').get() as CompassRow | undefined;
  if (!row) return null;
  return {
    signal_words: JSON.parse(row.signal_words),
    red_flag_words: JSON.parse(row.red_flag_words),
    compensation_floor: row.compensation_floor,
    ai_mode: (row.ai_mode || 'api') as AiMode,
    materials_mode: (row.materials_mode || 'summary') as MaterialsMode,
    reasoning_model: row.reasoning_model || DEFAULT_MODEL,
    local_base_url: row.local_base_url || 'http://localhost:1234/v1',
    local_model: row.local_model || '',
    local_api_key: row.local_api_key || null,
    updated_at: row.updated_at,
  };
}

export function upsertCompassConfig(data: {
  signal_words: string[];
  red_flag_words: string[];
  compensation_floor: number;
}): void {
  const db = getDb();
  // Insert the row if it doesn't exist yet (fresh DB via intake),
  // otherwise update in place without clobbering ai_mode / materials_mode.
  const existing = db.prepare('SELECT id FROM compass_config WHERE id = 1').get();
  if (existing) {
    db.prepare(`
      UPDATE compass_config
      SET signal_words = ?, red_flag_words = ?, compensation_floor = ?, updated_at = datetime('now')
      WHERE id = 1
    `).run(
      JSON.stringify(data.signal_words),
      JSON.stringify(data.red_flag_words),
      data.compensation_floor,
    );
  } else {
    db.prepare(`
      INSERT INTO compass_config (id, signal_words, red_flag_words, compensation_floor, ai_mode, materials_mode, updated_at)
      VALUES (1, ?, ?, ?, 'api', 'summary', datetime('now'))
    `).run(
      JSON.stringify(data.signal_words),
      JSON.stringify(data.red_flag_words),
      data.compensation_floor,
    );
  }
}

export function getAiMode(): AiMode {
  const config = getCompassConfig();
  return config?.ai_mode || 'api';
}

export function setAiMode(mode: AiMode): void {
  const db = getDb();
  db.prepare('UPDATE compass_config SET ai_mode = ?, updated_at = datetime(\'now\') WHERE id = 1').run(mode);
}

export function getMaterialsMode(): MaterialsMode {
  const config = getCompassConfig();
  return config?.materials_mode || 'summary';
}

export function setMaterialsMode(mode: MaterialsMode): void {
  const db = getDb();
  db.prepare('UPDATE compass_config SET materials_mode = ?, updated_at = datetime(\'now\') WHERE id = 1').run(mode);
}

export function getReasoningModel(): string {
  const config = getCompassConfig();
  return config?.reasoning_model || DEFAULT_MODEL;
}

export function setReasoningModel(model: string): void {
  const db = getDb();
  db.prepare('UPDATE compass_config SET reasoning_model = ?, updated_at = datetime(\'now\') WHERE id = 1').run(model);
}

export function getLocalConfig(): LocalConfig {
  const config = getCompassConfig();
  return {
    base_url: config?.local_base_url || 'http://localhost:1234/v1',
    model: config?.local_model || '',
    api_key: config?.local_api_key || null,
  };
}

export function setLocalConfig(cfg: LocalConfig): void {
  const db = getDb();
  db.prepare(
    "UPDATE compass_config SET local_base_url = ?, local_model = ?, local_api_key = ?, updated_at = datetime('now') WHERE id = 1",
  ).run(cfg.base_url, cfg.model, cfg.api_key);
}
