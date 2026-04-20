import type { DiscoveredPosting } from '@/lib/types';
import { fetchAts, htmlToText, clamp, type AtsAdapter } from './types';

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  content: string;
  location?: { name: string };
  metadata?: Array<{ name: string; value?: string | null }>;
  departments?: Array<{ name: string }>;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
  meta?: { total: number };
}

export const greenhouseAdapter: AtsAdapter = {
  provider: 'greenhouse',

  async fetchPostings(slug: string, company: string): Promise<DiscoveredPosting[]> {
    const res = await fetchAts(
      `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`,
    );
    if (!res || !res.ok) return [];

    const data = (await res.json()) as GreenhouseResponse;
    if (!Array.isArray(data.jobs)) return [];

    return data.jobs.map((j) => {
      const text = clamp(`${j.title}\n\n${htmlToText(j.content || '')}`);
      // Look for a "compensation"-ish metadata field — some Greenhouse boards
      // emit it under metadata with varying names.
      let salary: string | undefined;
      if (Array.isArray(j.metadata)) {
        const comp = j.metadata.find((m) =>
          /compensation|salary|pay/i.test(m.name || ''),
        );
        if (comp && typeof comp.value === 'string') salary = comp.value;
      }
      return {
        title: j.title,
        company,
        location: j.location?.name,
        url: j.absolute_url,
        posting_text: text,
        salary_range: salary,
        ats_provider: 'greenhouse',
      };
    });
  },
};
