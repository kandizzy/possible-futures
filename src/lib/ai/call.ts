// All Claude API and CLI calls flow through this file so every call is logged
// to ai_usage_log with cost. Two entry points — callAiApi and callAiCli —
// matching the two execution paths the app already supports.
//
// Callers pass an `operation` string identifying the feature (score_posting,
// generate_materials, generate_base_resume, discover_companies, etc.) so the
// ledger can break costs down by feature.

import type Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient } from './client';
import { claudeCli } from './cli';
import { callLocalChat } from './local';
import { computeCost, DEFAULT_MODEL } from './pricing';
import { getLocalConfig } from '../queries/compass';
import { insertAiUsageLog } from '../queries/ai-usage';

export interface LogContext {
  type: 'role' | 'company' | 'discovery_search' | 'resume_version' | string;
  id?: number;
}

export interface AiCallResult {
  text: string;
  logId: number;
  cost: number;
  model: string;
}

interface CallApiOpts {
  operation: string;
  model?: string;
  maxTokens: number;
  system: string | Anthropic.Messages.TextBlockParam[];
  messages: Anthropic.Messages.MessageParam[];
  context?: LogContext;
}

export async function callAiApi(opts: CallApiOpts): Promise<AiCallResult> {
  const model = opts.model ?? DEFAULT_MODEL;
  const client = getAnthropicClient();

  try {
    const response = await client.messages.create({
      model,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: opts.messages,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from API');
    }

    const usage = response.usage ?? {
      input_tokens: 0,
      output_tokens: 0,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    };
    const inputTokens = usage.input_tokens ?? 0;
    const outputTokens = usage.output_tokens ?? 0;
    const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
    const cacheWriteTokens = usage.cache_creation_input_tokens ?? 0;

    const cost = computeCost(model, {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cache_read_tokens: cacheReadTokens,
      cache_write_tokens: cacheWriteTokens,
    });

    const logId = insertAiUsageLog({
      operation: opts.operation,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cache_read_tokens: cacheReadTokens,
      cache_write_tokens: cacheWriteTokens,
      cost_usd: cost,
      context_type: opts.context?.type ?? null,
      context_id: opts.context?.id ?? null,
    });

    return { text: textBlock.text, logId, cost, model };
  } catch (err) {
    // Log the failure so the ledger reflects that we tried and why
    const msg = err instanceof Error ? err.message : String(err);
    insertAiUsageLog({
      operation: opts.operation,
      model,
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      context_type: opts.context?.type ?? null,
      context_id: opts.context?.id ?? null,
      error: msg,
    });
    throw err;
  }
}

interface CallCliOpts {
  operation: string;
  systemPrompt: string;
  userPrompt: string;
  context?: LogContext;
}

export async function callAiCli(opts: CallCliOpts): Promise<AiCallResult> {
  try {
    const text = await claudeCli(opts.systemPrompt, opts.userPrompt);
    const logId = insertAiUsageLog({
      operation: opts.operation,
      model: 'cli',
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      context_type: opts.context?.type ?? null,
      context_id: opts.context?.id ?? null,
    });
    return { text, logId, cost: 0, model: 'cli' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    insertAiUsageLog({
      operation: opts.operation,
      model: 'cli',
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      context_type: opts.context?.type ?? null,
      context_id: opts.context?.id ?? null,
      error: msg,
    });
    throw err;
  }
}

interface CallLocalOpts {
  operation: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  context?: LogContext;
}

export async function callAiLocal(opts: CallLocalOpts): Promise<AiCallResult> {
  const cfg = getLocalConfig();
  const modelLabel = cfg.model ? `local:${cfg.model}` : 'local';
  try {
    const text = await callLocalChat({
      baseUrl: cfg.base_url,
      model: cfg.model,
      apiKey: cfg.api_key,
      systemPrompt: opts.systemPrompt,
      userPrompt: opts.userPrompt,
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
    });
    const logId = insertAiUsageLog({
      operation: opts.operation,
      model: modelLabel,
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      context_type: opts.context?.type ?? null,
      context_id: opts.context?.id ?? null,
    });
    return { text, logId, cost: 0, model: modelLabel };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    insertAiUsageLog({
      operation: opts.operation,
      model: modelLabel,
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      context_type: opts.context?.type ?? null,
      context_id: opts.context?.id ?? null,
      error: msg,
    });
    throw err;
  }
}
