import type { AtsProvider } from '../types';

/**
 * Construct the canonical job board URL for an (ATS provider, slug) pair.
 * Matches the URL shapes that detect.ts parses, so a round-trip
 * (URL → detect → board-url) lands on a working board.
 */
export function getAtsBoardUrl(provider: AtsProvider, slug: string): string {
  const s = encodeURIComponent(slug);
  switch (provider) {
    case 'greenhouse':
      return `https://job-boards.greenhouse.io/${s}`;
    case 'lever':
      return `https://jobs.lever.co/${s}`;
    case 'ashby':
      return `https://jobs.ashbyhq.com/${s}`;
    case 'workable':
      return `https://apply.workable.com/${s}`;
  }
}
