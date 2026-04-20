import { getDb } from '../db';

export interface AiUsageLogRow {
  id: number;
  timestamp: string;
  operation: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  cost_usd: number;
  context_type: string | null;
  context_id: number | null;
  error: string | null;
}

export interface InsertAiUsageLog {
  operation: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
  cost_usd: number;
  context_type?: string | null;
  context_id?: number | null;
  error?: string | null;
}

export function insertAiUsageLog(row: InsertAiUsageLog): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO ai_usage_log (
      operation, model,
      input_tokens, output_tokens,
      cache_read_tokens, cache_write_tokens,
      cost_usd, context_type, context_id, error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    row.operation,
    row.model,
    row.input_tokens,
    row.output_tokens,
    row.cache_read_tokens ?? 0,
    row.cache_write_tokens ?? 0,
    row.cost_usd,
    row.context_type ?? null,
    row.context_id ?? null,
    row.error ?? null,
  );
  return Number(result.lastInsertRowid);
}

export interface UsageTotals {
  total_cost: number;
  total_calls: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cache_read_tokens: number;
  total_cache_write_tokens: number;
}

export function getUsageTotals(): UsageTotals {
  const db = getDb();
  const row = db.prepare(`
    SELECT
      COALESCE(SUM(cost_usd), 0) AS total_cost,
      COUNT(*) AS total_calls,
      COALESCE(SUM(input_tokens), 0) AS total_input_tokens,
      COALESCE(SUM(output_tokens), 0) AS total_output_tokens,
      COALESCE(SUM(cache_read_tokens), 0) AS total_cache_read_tokens,
      COALESCE(SUM(cache_write_tokens), 0) AS total_cache_write_tokens
    FROM ai_usage_log
  `).get() as UsageTotals;
  return row;
}

export interface UsageByOperation {
  operation: string;
  calls: number;
  total_cost: number;
  avg_cost: number;
}

export function getUsageByOperation(): UsageByOperation[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      operation,
      COUNT(*) AS calls,
      COALESCE(SUM(cost_usd), 0) AS total_cost,
      COALESCE(AVG(cost_usd), 0) AS avg_cost
    FROM ai_usage_log
    GROUP BY operation
    ORDER BY total_cost DESC
  `).all() as UsageByOperation[];
}

export function getRecentUsage(limit = 50): AiUsageLogRow[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM ai_usage_log
    ORDER BY id DESC
    LIMIT ?
  `).all(limit) as AiUsageLogRow[];
}

export function getAllUsage(): AiUsageLogRow[] {
  const db = getDb();
  return db.prepare('SELECT * FROM ai_usage_log ORDER BY id DESC').all() as AiUsageLogRow[];
}
