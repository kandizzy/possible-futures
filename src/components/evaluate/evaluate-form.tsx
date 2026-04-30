'use client';

import { useState, useTransition } from 'react';
import { evaluatePosting, type EvaluateResult } from '@/actions/evaluate';
import { ScoringResults } from './scoring-results';

export function EvaluateForm({
  aiMode,
  versionLabels,
}: {
  aiMode: 'api' | 'cli' | 'local';
  versionLabels: Record<string, string>;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<EvaluateResult | null>(null);
  const [inputMode, setInputMode] = useState<'url' | 'paste'>('paste');

  function handleSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await evaluatePosting(formData);
      setResult(res);
    });
  }

  return (
    <div>
      {/* Input mode tabs */}
      <div className="flex items-baseline gap-6 pb-3 border-b border-rule mb-6">
        <button
          type="button"
          onClick={() => setInputMode('paste')}
          className="relative"
        >
          <span
            className={`font-serif text-[16px] transition-colors ${
              inputMode === 'paste'
                ? 'text-stamp italic'
                : 'text-ink-2 hover:text-ink'
            }`}
            style={{
              fontVariationSettings:
                inputMode === 'paste' ? '"opsz" 16, "SOFT" 60' : '"opsz" 16',
            }}
          >
            Paste text
          </span>
          {inputMode === 'paste' && (
            <span
              aria-hidden
              className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-stamp"
            />
          )}
        </button>
        <button
          type="button"
          onClick={() => setInputMode('url')}
          className="relative"
        >
          <span
            className={`font-serif text-[16px] transition-colors ${
              inputMode === 'url'
                ? 'text-stamp italic'
                : 'text-ink-2 hover:text-ink'
            }`}
            style={{
              fontVariationSettings:
                inputMode === 'url' ? '"opsz" 16, "SOFT" 60' : '"opsz" 16',
            }}
          >
            Fetch URL
          </span>
          {inputMode === 'url' && (
            <span
              aria-hidden
              className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-stamp"
            />
          )}
        </button>
      </div>

      <form action={handleSubmit}>
        {inputMode === 'url' ? (
          <div className="mb-6">
            <label
              htmlFor="url"
              className="smallcaps text-[9px] text-ink-3 block mb-2"
            >
              Job posting URL
            </label>
            <input
              id="url"
              name="url"
              type="url"
              placeholder="https://boards.greenhouse.io/…"
              className="field w-full"
              disabled={isPending}
            />
            <p
              className="mt-2 font-serif italic text-[12px] text-ink-3"
              style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
            >
              Many job sites use JavaScript rendering. If the fetch returns garbage,
              switch to Paste text.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <label
              htmlFor="posting_text"
              className="smallcaps text-[9px] text-ink-3 block mb-2"
            >
              Job posting text
            </label>
            <textarea
              id="posting_text"
              name="posting_text"
              rows={14}
              placeholder="Paste the full job posting here…"
              className="field w-full font-serif text-[14px] leading-[1.65] resize-y"
              style={{ fontVariationSettings: '"opsz" 14, "SOFT" 30' }}
              disabled={isPending}
            />
          </div>
        )}

        {!isPending && (
          <button type="submit" className="btn-stamp">
            Evaluate
          </button>
        )}
      </form>

      {/* Scoring indicator */}
      {isPending && (
        <div className="mt-8 p-6 md:p-8 border border-rule bg-paper-2/40">
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5" aria-hidden>
              <span className="h-2 w-2 rounded-full bg-stamp animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 rounded-full bg-stamp animate-pulse" style={{ animationDelay: '300ms' }} />
              <span className="h-2 w-2 rounded-full bg-stamp animate-pulse" style={{ animationDelay: '600ms' }} />
            </div>
            <span
              className="font-serif italic text-[17px] text-ink"
              style={{ fontVariationSettings: '"opsz" 17, "SOFT" 50' }}
            >
              Reading the posting against your compass
            </span>
          </div>
          <p
            className="mt-3 font-mono text-[11px] text-ink-3"
          >
            Scoring via {aiMode === 'cli' ? 'Claude CLI' : aiMode === 'local' ? 'your local model' : 'Anthropic API'} · typically 15-30 seconds{aiMode === 'cli' ? ' (CLI can be slower)' : aiMode === 'local' ? ' (local can be slower)' : ''}
          </p>
        </div>
      )}

      {/* Error */}
      {!isPending && result && !result.success && (
        <div className="mt-8 p-5 border border-stamp bg-stamp/5">
          <div className="smallcaps text-[9px] text-stamp mb-2">Error</div>
          <p className="font-serif italic text-[14px] text-ink whitespace-pre-line">{result.error}</p>
        </div>
      )}

      {/* Results */}
      {result?.success && result.scoring && (
        <ScoringResults
          scoring={result.scoring}
          roleId={result.roleId!}
          versionLabels={versionLabels}
        />
      )}
    </div>
  );
}
