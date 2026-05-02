'use client';

import { useState, useTransition } from 'react';
import {
  suggestCompaniesAction,
  skipSuggestedCompany,
  reverifyPendingSuggestions,
  type VerifiedSuggestion,
} from '@/actions/discover';
import { PRICING, formatUsd, estimateCost } from '@/lib/ai/pricing';
import { LoadingPanel } from '@/components/layout/editorial';
import { CompanyFormModal } from '@/components/companies/company-form-modal';
import { SuggestionCard } from './suggestion-card';

const DEFAULT_INPUT_EST = 8000;
const DEFAULT_OUTPUT_EST = 3000;

interface Props {
  defaultModel: string;
  initialSuggestions?: VerifiedSuggestion[];
  lastSearchCost?: number | null;
  lastSearchModel?: string | null;
}

export function DiscoverClient({
  defaultModel,
  initialSuggestions,
  lastSearchCost,
  lastSearchModel,
}: Props) {
  const [roleType, setRoleType] = useState('');
  const [model, setModel] = useState<string>(defaultModel);
  const [isSuggesting, startSuggesting] = useTransition();
  const [results, setResults] = useState<VerifiedSuggestion[] | null>(
    initialSuggestions && initialSuggestions.length > 0 ? initialSuggestions : null,
  );
  const [lastCost, setLastCost] = useState<number | null>(lastSearchCost ?? null);
  const [lastModel, setLastModel] = useState<string | null>(lastSearchModel ?? null);
  const [error, setError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [lastManualAdd, setLastManualAdd] = useState<string | null>(null);
  const [isReverifying, startReverifying] = useTransition();
  const [reverifyResult, setReverifyResult] = useState<string | null>(null);

  const unverifiedCount = results?.filter((s) => !s.verified).length ?? 0;

  function handleReverify() {
    setError(null);
    setReverifyResult(null);
    startReverifying(async () => {
      const res = await reverifyPendingSuggestions();
      if (res.newlyVerified > 0) {
        // Update local state with fresh verification data
        setResults((prev) => {
          if (!prev) return prev;
          // We don't have the updated rows client-side, so trigger a page refresh
          // to pick up the DB changes. This is simpler than threading all fields back.
          window.location.reload();
          return prev;
        });
      }
      setReverifyResult(
        res.newlyVerified > 0
          ? `Verified ${res.newlyVerified} of ${res.checked} companies (${res.totalPostings} postings found)`
          : `Checked ${res.checked} companies — none found on supported ATS providers`
      );
    });
  }

  function handleSuggest() {
    setError(null);
    startSuggesting(async () => {
      const formData = new FormData();
      if (roleType.trim()) formData.set('role_type', roleType.trim());
      formData.set('model', model);
      const res = await suggestCompaniesAction(formData);
      if (!res.ok) {
        setError(res.error ?? 'Unknown error');
        return;
      }
      // Merge new suggestions with existing pending ones
      setResults((prev) => {
        const existing = prev || [];
        const existingNames = new Set(existing.map((s) => s.name));
        const newOnes = (res.suggestions ?? []).filter((s) => !existingNames.has(s.name));
        return [...newOnes, ...existing];
      });
      setLastCost(res.cost_usd ?? null);
      setLastModel(res.model ?? null);
    });
  }

  function handleTrackDone(id: number) {
    setResults((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
  }

  async function handleSkip(id: number) {
    await skipSuggestedCompany(id);
    setResults((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
  }

  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  return (
    <div className="space-y-12 rise" style={{ animationDelay: '80ms' }}>
      {/* Query form */}
      <section className="border border-rule bg-paper-2/40 p-5 md:p-6">
        <label
          htmlFor="role-type"
          className="block smallcaps text-[9px] text-ink-3 mb-3"
        >
          What kind of role are you looking for? (optional)
        </label>
        <input
          id="role-type"
          type="text"
          value={roleType}
          onChange={(e) => setRoleType(e.target.value)}
          placeholder="Leave blank to use your full compass. Or e.g. Staff Design Engineer, Creative Technologist…"
          className="field w-full"
        />

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="smallcaps text-[9px] text-ink-3 mr-2">Model</span>
            {Object.entries(PRICING).map(([id, rates]) => {
              const estimate = estimateCost(id, DEFAULT_INPUT_EST, DEFAULT_OUTPUT_EST);
              const isActive = model === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setModel(id)}
                  disabled={isSuggesting}
                  className={`px-3 py-2 text-[11px] font-mono tabular border transition-colors ${
                    isActive
                      ? 'border-ink bg-paper shadow-[2px_2px_0_var(--ink)]'
                      : 'border-rule bg-paper-2/40 hover:border-ink-2'
                  } disabled:opacity-50`}
                >
                  {rates.label} · ~{formatUsd(estimate)}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleSuggest}
            disabled={isSuggesting}
            className="btn-stamp disabled:opacity-50"
          >
            {isSuggesting ? 'Thinking…' : results ? 'Suggest more →' : 'Suggest companies →'}
          </button>
        </div>

        {lastCost !== null && lastModel && (
          <div className="mt-4 pt-4 border-t border-rule-soft">
            <p className="font-mono tabular text-[11px] text-ink-3">
              Last search: {formatUsd(lastCost)} · {lastModel}
            </p>
          </div>
        )}
      </section>

      {/* Loading — Discover runs three phases: candidate generation,
          parallel ATS verification, then a grounding pass to filter
          confabulated rationales. The whole thing can take a minute or
          two, especially via CLI or local model. */}
      {isSuggesting && (
        <LoadingPanel
          message="Reading your compass for company candidates"
          caption="Generating candidates · verifying ATS · grounding rationales — typically 30–60s via Anthropic API, longer via CLI or local model"
        />
      )}

      {/* Error state */}
      {error && !isSuggesting && (
        <div className="border-l-2 border-stamp pl-4 py-2">
          <p
            className="font-serif italic text-[14px] text-stamp"
            style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
          >
            {error}
          </p>
        </div>
      )}

      {/* Re-verify banner */}
      {results && unverifiedCount > 0 && (
        <section className="border border-rule bg-paper-2/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="font-mono tabular text-[11px] text-ink-2">
            {unverifiedCount} suggestion{unverifiedCount === 1 ? '' : 's'} without ATS verification
          </p>
          <button
            type="button"
            onClick={handleReverify}
            disabled={isReverifying}
            className="btn-link disabled:opacity-50 whitespace-nowrap"
          >
            {isReverifying ? 'Re-verifying…' : 'Re-verify all →'}
          </button>
        </section>
      )}
      {reverifyResult && (
        <div className="font-mono tabular text-[11px] text-ink-2 px-1">
          {reverifyResult}
        </div>
      )}

      {/* Results */}
      {results && (
        <section>
          <div className="flex items-baseline justify-between mb-5 pb-2 border-b border-rule">
            <h2 className="smallcaps text-[10px] text-ink-3">Suggestions</h2>
            <span className="font-mono tabular text-[10px] text-ink-3">
              {String(results.length).padStart(2, '0')}
            </span>
          </div>

          {results.length === 0 ? (
            <p
              className="font-serif italic text-[15px] text-ink-2 py-6"
              style={{ fontVariationSettings: '"opsz" 15, "SOFT" 40' }}
            >
              All suggestions have been processed. Run another search or add companies manually below.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.slice(0, visibleCount).map((s) => (
                  <SuggestionCard
                    key={s.id}
                    suggestion={s}
                    onTrack={() => handleTrackDone(s.id)}
                    onSkip={() => handleSkip(s.id)}
                  />
                ))}
              </div>
              {visibleCount < results.length && (
                <div className="pt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                    className="font-serif italic text-[14px] text-ink-2 hover:text-stamp transition-colors cursor-pointer underline decoration-rule hover:decoration-stamp"
                    style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
                  >
                    Show {Math.min(PAGE_SIZE, results.length - visibleCount)} more
                    <span className="font-mono tabular text-[11px] text-ink-3 ml-2">
                      ({visibleCount} of {results.length})
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Manual add fallback — opens the same modal used on /companies.
          /discover only shows AI suggestions, so after a manual add the user
          would otherwise see no feedback (the new company lives on /companies).
          We surface a small "added X — view in Companies →" line so it's
          clear what happened and where it went. */}
      <section className="pt-6 border-t border-rule space-y-3">
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className="font-serif italic text-[14px] text-ink-2 hover:text-stamp transition-colors"
          style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
        >
          Company not in the list? Add it yourself →
        </button>
        {lastManualAdd && (
          <p
            className="font-serif italic text-[13px] text-ink-2"
            style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
          >
            Added <span className="text-stamp">{lastManualAdd}</span> to your watchlist —{' '}
            <a
              href="/companies"
              className="text-ink hover:text-stamp transition-colors underline decoration-rule hover:decoration-stamp"
            >
              view in Companies →
            </a>
          </p>
        )}
      </section>

      <CompanyFormModal
        mode="add"
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onSuccess={({ name }) => setLastManualAdd(name)}
      />
    </div>
  );
}
