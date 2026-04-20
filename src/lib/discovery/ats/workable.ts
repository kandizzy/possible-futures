import type { DiscoveredPosting } from '@/lib/types';
import { fetchAts, htmlToText, clamp, type AtsAdapter } from './types';

interface WorkableJob {
  id: string | number;
  title: string;
  shortcode?: string;
  code?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    telecommuting?: boolean;
  };
  full_title?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  url?: string;
  application_url?: string;
}

interface WorkableResponse {
  jobs?: WorkableJob[];
  results?: WorkableJob[];
}

export const workableAdapter: AtsAdapter = {
  provider: 'workable',

  async fetchPostings(slug: string, company: string): Promise<DiscoveredPosting[]> {
    // Workable has multiple public endpoints; widget accounts is the most
    // broadly supported and doesn't require authentication for read.
    const res = await fetchAts(
      `https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(slug)}?details=true`,
    );
    if (!res || !res.ok) return [];

    const data = (await res.json()) as WorkableResponse;
    const jobs = data.jobs || data.results || [];
    if (!Array.isArray(jobs)) return [];

    return jobs.map((j) => {
      const text = clamp(
        [j.title, htmlToText(j.description || ''), htmlToText(j.requirements || '')]
          .filter(Boolean)
          .join('\n\n'),
      );
      const locParts = [j.location?.city, j.location?.region, j.location?.country].filter(
        Boolean,
      );
      const location = locParts.join(', ') || (j.location?.telecommuting ? 'Remote' : undefined);
      const url =
        j.url ||
        j.application_url ||
        (j.shortcode
          ? `https://apply.workable.com/${encodeURIComponent(slug)}/j/${j.shortcode}/`
          : `https://apply.workable.com/${encodeURIComponent(slug)}/`);
      return {
        title: j.title,
        company,
        location,
        url,
        posting_text: text,
        ats_provider: 'workable',
      };
    });
  },
};
