// Single source of truth for Claude API pricing. Edit this file when Anthropic
// changes rates or when you want to add/swap models. The ledger page reads from
// here for cost estimates and displayed rates.
//
// Rates are in USD per 1 million tokens.
// Verified against https://platform.claude.com/docs/en/about-claude/pricing
// Last checked: April 2026

export interface ModelRates {
  input_per_mtok: number;
  output_per_mtok: number;
  cache_write_per_mtok: number;
  cache_read_per_mtok: number;
  label: string;
}

export const PRICING: Record<string, ModelRates> = {
  'claude-sonnet-4-6': {
    label: 'Sonnet 4.6',
    input_per_mtok: 3.0,
    output_per_mtok: 15.0,
    cache_write_per_mtok: 3.75,
    cache_read_per_mtok: 0.3,
  },
  'claude-opus-4-6': {
    label: 'Opus 4.6',
    input_per_mtok: 5.0,
    output_per_mtok: 25.0,
    cache_write_per_mtok: 6.25,
    cache_read_per_mtok: 0.5,
  },
};

export const DEFAULT_MODEL = 'claude-sonnet-4-6';
export const REASONING_MODEL = 'claude-opus-4-6';

export interface UsageTokens {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
}

export function computeCost(model: string, usage: UsageTokens): number {
  const rates = PRICING[model];
  if (!rates) return 0;
  const input = (usage.input_tokens / 1_000_000) * rates.input_per_mtok;
  const output = (usage.output_tokens / 1_000_000) * rates.output_per_mtok;
  const cacheWrite =
    ((usage.cache_write_tokens ?? 0) / 1_000_000) * rates.cache_write_per_mtok;
  const cacheRead =
    ((usage.cache_read_tokens ?? 0) / 1_000_000) * rates.cache_read_per_mtok;
  return input + output + cacheWrite + cacheRead;
}

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  return computeCost(model, {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  });
}

export function formatUsd(amount: number): string {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 1) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(2)}`;
}

export function getModelLabel(model: string): string {
  return PRICING[model]?.label ?? model;
}
