import Anthropic from '@anthropic-ai/sdk';
import { DEFAULT_MODEL } from './pricing';

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required. Set it in .env.local');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Model precedence: ANTHROPIC_MODEL env var → compass_config.reasoning_model →
// DEFAULT_MODEL from pricing.ts. The DB lookup is lazy so this stays usable at
// module-init time before the DB exists.
export function getModel(): string {
  if (process.env.ANTHROPIC_MODEL) return process.env.ANTHROPIC_MODEL;
  try {
    // Imported lazily to avoid a circular compass.ts -> pricing.ts -> client.ts
    // load order during bundler resolution.
    const { getReasoningModel } = require('../queries/compass') as typeof import('../queries/compass');
    const fromSettings = getReasoningModel();
    if (fromSettings) return fromSettings;
  } catch {
    // DB not initialized yet (build time, tests using client mock) — fall through
  }
  return DEFAULT_MODEL;
}
