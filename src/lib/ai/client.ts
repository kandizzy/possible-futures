import Anthropic from '@anthropic-ai/sdk';
import { DEFAULT_MODEL } from './pricing';
import { getReasoningModel } from '../queries/compass';

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
// DEFAULT_MODEL from pricing.ts. The DB lookup is wrapped in try/catch so this
// stays usable at module-init time before the DB exists (build, tests).
export function getModel(): string {
  if (process.env.ANTHROPIC_MODEL) return process.env.ANTHROPIC_MODEL;
  try {
    const fromSettings = getReasoningModel();
    if (fromSettings) return fromSettings;
  } catch {
    // DB not initialized yet — fall through
  }
  return DEFAULT_MODEL;
}
