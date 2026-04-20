import type { AtsProvider } from '@/lib/types';
import type { AtsAdapter } from './types';
import { greenhouseAdapter } from './greenhouse';
import { leverAdapter } from './lever';
import { ashbyAdapter } from './ashby';
import { workableAdapter } from './workable';

const REGISTRY: Record<AtsProvider, AtsAdapter> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  ashby: ashbyAdapter,
  workable: workableAdapter,
};

// Lever's public API (v0) is deprecated and v1 requires auth.
// Skip it in the default rotation to avoid wasting 4 requests per company.
const ACTIVE_PROVIDERS: AtsProvider[] = ['greenhouse', 'ashby', 'workable'];

export function getAdapter(provider: AtsProvider): AtsAdapter {
  const adapter = REGISTRY[provider];
  if (!adapter) throw new Error(`Unknown ATS provider: ${provider}`);
  return adapter;
}

export function listProviders(): AtsProvider[] {
  return ACTIVE_PROVIDERS;
}

export type { AtsAdapter };
