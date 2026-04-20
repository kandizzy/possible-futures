import type { DiscoveredPosting } from '@/lib/types';
import { fetchAts, htmlToText, clamp, type AtsAdapter } from './types';

interface AshbyJob {
  id: string;
  title: string;
  department?: string;
  team?: string;
  employmentType?: string;
  location?: string;
  jobUrl: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
  compensation?: {
    compensationTierSummary?: string;
    summaryComponents?: Array<{ summary?: string }>;
  };
}

interface AshbyResponse {
  jobs: AshbyJob[];
  apiVersion?: string;
}

export const ashbyAdapter: AtsAdapter = {
  provider: 'ashby',

  async fetchPostings(slug: string, company: string): Promise<DiscoveredPosting[]> {
    const res = await fetchAts(
      `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}?includeCompensation=true`,
    );
    if (!res || !res.ok) return [];

    const data = (await res.json()) as AshbyResponse;
    if (!Array.isArray(data.jobs)) return [];

    return data.jobs.map((j) => {
      const description = j.descriptionPlain || htmlToText(j.descriptionHtml || '');
      const text = clamp(`${j.title}\n\n${description}`);
      const salary =
        j.compensation?.compensationTierSummary ||
        j.compensation?.summaryComponents?.map((s) => s.summary).filter(Boolean).join(' · ') ||
        undefined;
      return {
        title: j.title,
        company,
        location: j.location,
        url: j.jobUrl,
        posting_text: text,
        salary_range: salary,
        ats_provider: 'ashby',
      };
    });
  },
};
