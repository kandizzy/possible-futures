import { scorePosting } from '@/lib/ai/scoring';
import { insertRole, getRoleUrls } from '@/lib/queries/roles';
import {
  getCompaniesWithAts,
  updateCompanyLastScanned,
} from '@/lib/queries/companies';
import {
  updateDiscoveryRun,
  appendDiscoveryLog,
  getDiscoveryRun,
} from '@/lib/queries/discovery';
import { getAdapter } from './ats';
import type { Company, DiscoveredPosting, AtsProvider } from '@/lib/types';

export interface OrchestratorDeps {
  getCompanies?: () => Company[];
  fetchPostings?: (
    provider: AtsProvider,
    slug: string,
    company: string,
  ) => Promise<DiscoveredPosting[]>;
  scorePosting?: (text: string, url?: string | null) => Promise<Awaited<ReturnType<typeof scorePosting>>>;
  now?: () => string;
}

/**
 * The main discovery loop. Reads companies with configured ATS providers,
 * fetches current postings from each, dedupes against existing role URLs,
 * scores new postings via the existing AI pipeline (prompt-cached for
 * cost efficiency), and writes them into the roles table with
 * source='discovered'. Progress is written to the runs row as each step
 * completes so the UI can poll.
 *
 * deps allows injecting mocks for unit tests.
 */
export async function runRoleDiscovery(
  runId: number,
  deps: OrchestratorDeps = {},
): Promise<void> {
  const getCompanies = deps.getCompanies || getCompaniesWithAts;
  const fetchPostings =
    deps.fetchPostings ||
    (async (provider, slug, company) => {
      const adapter = getAdapter(provider);
      return adapter.fetchPostings(slug, company);
    });
  const scoreFn = deps.scorePosting || ((text, url) => scorePosting(text, undefined, undefined, url));
  const now = deps.now || (() => new Date().toISOString());

  const companies = getCompanies();
  appendDiscoveryLog(runId, {
    level: 'info',
    msg: `Starting run — ${companies.length} companies with ATS configured`,
  });

  if (companies.length === 0) {
    appendDiscoveryLog(runId, {
      level: 'warn',
      msg: 'No companies have an ATS provider + slug configured. Set one from the Companies page.',
    });
    updateDiscoveryRun(runId, { status: 'done', ended_at: now(), current_company: null });
    return;
  }

  let companiesChecked = 0;
  let postingsFound = 0;
  let postingsNew = 0;
  let postingsScored = 0;

  for (const company of companies) {
    // Cancellation check — user can cancel mid-run via the UI
    const current = getDiscoveryRun(runId);
    if (current?.status === 'cancelled') {
      appendDiscoveryLog(runId, { level: 'info', msg: 'Run cancelled by user' });
      updateDiscoveryRun(runId, { ended_at: now(), current_company: null });
      return;
    }

    try {
      updateDiscoveryRun(runId, { current_company: company.name });
      appendDiscoveryLog(runId, { level: 'info', msg: `Checking ${company.name}…` });

      const provider = company.ats_provider as AtsProvider;
      const slug = company.ats_slug as string;
      const postings = await fetchPostings(provider, slug, company.name);

      postingsFound += postings.length;

      const existingUrls = new Set(getRoleUrls());
      const newPostings = postings.filter((p) => !existingUrls.has(p.url));
      postingsNew += newPostings.length;

      appendDiscoveryLog(runId, {
        level: 'info',
        msg: `${company.name}: ${postings.length} found, ${newPostings.length} new`,
      });

      updateDiscoveryRun(runId, {
        postings_found: postingsFound,
        postings_new: postingsNew,
      });

      for (const posting of newPostings) {
        try {
          const scoring = await scoreFn(posting.posting_text, posting.url);

          insertRole({
            title: posting.title || scoring.role_title || 'Untitled',
            company: posting.company || scoring.company || company.name,
            url: posting.url,
            posting_text: posting.posting_text,
            salary_range: posting.salary_range || scoring.salary_range || undefined,
            location: posting.location || scoring.location || undefined,
            ai_scores: scoring.scores,
            ai_recommendation: scoring.recommendation,
            recommended_resume_version: scoring.recommended_resume_version,
            signal_words_found: scoring.signal_words_found,
            red_flags_found: scoring.red_flags_found,
            fit_summary: scoring.fit_summary,
            gap_analysis: scoring.gap_analysis,
            status: 'New',
            source: 'discovered',
            discovered_by_run_id: runId,
          });

          postingsScored++;
          updateDiscoveryRun(runId, { postings_scored: postingsScored });
        } catch (err) {
          // Unique-index conflict (race) or scoring failure — log and move on
          const msg = err instanceof Error ? err.message : String(err);
          appendDiscoveryLog(runId, {
            level: 'warn',
            msg: `skipped '${posting.title}' @ ${company.name}: ${msg}`,
          });
        }
      }

      updateCompanyLastScanned(company.id);
      companiesChecked++;
      updateDiscoveryRun(runId, { companies_checked: companiesChecked });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      appendDiscoveryLog(runId, {
        level: 'error',
        msg: `${company.name}: ${msg}`,
      });
      // Still count this company as checked so the progress bar advances
      companiesChecked++;
      updateDiscoveryRun(runId, { companies_checked: companiesChecked });
    }
  }

  // Detect "silent failure" — we found postings but scored none of them and
  // at least one per-posting warning was logged. The most common cause is a
  // missing/invalid ANTHROPIC_API_KEY, which makes every scoring call throw.
  // Without this check the run looks identical to "nothing new" which is a
  // very frustrating user experience.
  const isSilentFailure = postingsNew > 0 && postingsScored === 0;
  if (isSilentFailure) {
    // Pull the first warn/error out of the log to use as the top-level error.
    const run = getDiscoveryRun(runId);
    const firstIssue = run?.log.find((e) => e.level === 'warn' || e.level === 'error');
    const errorMsg = firstIssue
      ? `Scored 0 of ${postingsNew} new postings. First issue: ${firstIssue.msg}`
      : `Scored 0 of ${postingsNew} new postings. Check the server logs or your ANTHROPIC_API_KEY.`;

    appendDiscoveryLog(runId, { level: 'error', msg: errorMsg });
    updateDiscoveryRun(runId, {
      status: 'error',
      ended_at: now(),
      current_company: null,
      error: errorMsg,
    });
    return;
  }

  appendDiscoveryLog(runId, {
    level: 'info',
    msg: `Done — ${postingsScored} new roles scored across ${companiesChecked} companies`,
  });
  updateDiscoveryRun(runId, {
    status: 'done',
    ended_at: now(),
    current_company: null,
  });
}
