import type { DiscoveredPosting } from '@/lib/types';
import { fetchAts, clamp, type AtsAdapter } from './types';

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  categories?: {
    location?: string;
    department?: string;
    team?: string;
    commitment?: string;
  };
  descriptionPlain?: string;
  description?: string;
  additionalPlain?: string;
  salaryRange?: { min?: number; max?: number; currency?: string };
}

export const leverAdapter: AtsAdapter = {
  provider: 'lever',

  async fetchPostings(slug: string, company: string): Promise<DiscoveredPosting[]> {
    const res = await fetchAts(
      `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`,
    );
    if (!res || !res.ok) return [];

    const data = (await res.json()) as LeverPosting[];
    if (!Array.isArray(data)) return [];

    return data.map((j) => {
      const description = j.descriptionPlain || j.description || '';
      const additional = j.additionalPlain || '';
      const text = clamp(
        [j.text, description, additional].filter(Boolean).join('\n\n'),
      );
      let salary: string | undefined;
      if (j.salaryRange?.min && j.salaryRange?.max) {
        const cur = j.salaryRange.currency || '';
        salary = `${cur}${j.salaryRange.min.toLocaleString()}–${j.salaryRange.max.toLocaleString()}`;
      }
      return {
        title: j.text,
        company,
        location: j.categories?.location,
        url: j.hostedUrl,
        posting_text: text,
        salary_range: salary,
        ats_provider: 'lever',
      };
    });
  },
};
