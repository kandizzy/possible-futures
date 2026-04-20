import { getCompassConfig } from '../queries/compass';
import { getSourceFile } from '../queries/source-files';

export interface PostingPreview {
  cache_id: number;
  title: string;
  url: string | null;
  location: string | null;
  matched: boolean;
}

function extractRoleTierKeywords(): string[] {
  const compass = getSourceFile('JOB_SEARCH_COMPASS.md');
  if (!compass?.content) return [];

  const keywords: string[] = [];

  // Extract role tier titles from compass markdown
  const tierSection = compass.content.match(/## Role Tiers[\s\S]*?(?=\n## |$)/i);
  if (tierSection) {
    const bullets = tierSection[0].match(/^- .+$/gm) || [];
    for (const bullet of bullets) {
      keywords.push(bullet.replace(/^- /, '').trim().toLowerCase());
    }
  }

  // Extract dream role line
  const dreamMatch = compass.content.match(/\*\*Dream role:\*\*\s*(.+)/i);
  if (dreamMatch) {
    const words = dreamMatch[1].toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    keywords.push(...words);
  }

  return keywords;
}

function buildMatchTerms(): string[] {
  const config = getCompassConfig();
  const tierKeywords = extractRoleTierKeywords();

  const terms: string[] = [];

  // Role tier titles (e.g., "Design Engineer", "Creative Technologist")
  for (const kw of tierKeywords) {
    terms.push(kw);
  }

  // Signal words from compass config
  if (config?.signal_words) {
    for (const sw of config.signal_words) {
      if (sw.length > 2) terms.push(sw.toLowerCase());
    }
  }

  return [...new Set(terms)];
}

export function matchPostings(
  postings: { id: number; title: string; url: string | null; location: string | null }[],
): PostingPreview[] {
  const terms = buildMatchTerms();

  return postings.map((p) => {
    const titleLower = p.title.toLowerCase();
    const matched = terms.some((term) => titleLower.includes(term));
    return {
      cache_id: p.id,
      title: p.title,
      url: p.url,
      location: p.location,
      matched,
    };
  });
}
