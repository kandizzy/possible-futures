import type { AtsProvider, DiscoveredPosting } from '@/lib/types';

export interface AtsAdapter {
  provider: AtsProvider;
  /**
   * Fetch current postings for a given board slug. Must return [] on 404 or
   * network failure — the orchestrator treats [] as "nothing new" and moves on.
   * Should throw only on unexpected programming errors.
   */
  fetchPostings(slug: string, company: string): Promise<DiscoveredPosting[]>;
}

/** Shared request helper with timeout + UA. */
export async function fetchAts(url: string, timeoutMs = 30_000): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Possible Futures (https://github.com/kandizzy/possible-futures) - local job search tool',
        Accept: 'application/json',
      },
    });
    return res;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return null;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Convert HTML to plain text. Shared across adapters that return HTML-only
 * descriptions (Greenhouse, Ashby). Simplified cousin of the logic in
 * src/lib/parsers/posting.ts — we want to preserve the HTML tags for block
 * structure but not script/style content.
 */
export function htmlToText(html: string): string {
  if (!html) return '';
  // Some vendors (Greenhouse) serve double-encoded entities
  let text = decodeEntities(html);
  if (/&lt;|&amp;|&quot;/.test(text)) text = decodeEntities(text);

  // Drop script/style blocks entirely
  text = text.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
  // Convert common block tags to newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|ul|ol|br|hr|tr|table)>/gi, '\n');
  text = text.replace(/<(br|hr)\s*\/?\s*>/gi, '\n');
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, '');
  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

function decodeEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&amp;/g, '&');
}

/**
 * Clamp a description to keep individual posting texts reasonable. Greenhouse
 * jobs routinely run 5k+ characters; for scoring purposes, the first ~8k is
 * plenty and anything longer is usually boilerplate.
 */
export function clamp(text: string, max = 8000): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '\n\n[…truncated]';
}
