'use client';

import { useState, useTransition } from 'react';
import { refreshSourceFiles } from '@/actions/settings';
import { Panel } from '@/components/layout/editorial';

interface SourceFilesRefreshProps {
  initialFiles: Array<{ filename: string; last_loaded_at: string }>;
  paths: Record<string, string>;
}

export function SourceFilesRefresh({ initialFiles, paths }: SourceFilesRefreshProps) {
  const [files, setFiles] = useState(initialFiles);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function handleRefresh() {
    setFeedback(null);
    startTransition(async () => {
      const result = await refreshSourceFiles();
      setFiles(result.files);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Refreshed' });
      } else {
        setFeedback({ type: 'error', message: result.error || 'Failed to refresh.' });
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  return (
    <Panel
      title="Source Files"
      description="Refresh cached copies from disk. Re-parses the Compass and updates signal words and red flags."
      action={
        feedback && (
          <span
            className={`smallcaps text-[9px] ${
              feedback.type === 'success' ? 'text-stamp' : 'text-stamp'
            }`}
          >
            {feedback.message}
          </span>
        )
      }
    >
      {files.length === 0 ? (
        <p
          className="font-serif italic text-[13px] text-ink-3"
          style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
        >
          No source files cached. Run the seed script first.
        </p>
      ) : (
        <ol className="divide-y divide-rule-soft border-t border-b border-rule-soft mb-5">
          {files.map((f) => (
            <li key={f.filename} className="py-3">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[12px] text-ink">{f.filename}</span>
                <span className="font-mono tabular text-[10px] text-ink-3">
                  {f.last_loaded_at || 'Not loaded'}
                </span>
              </div>
              {paths[f.filename] && (
                <span className="font-mono text-[10px] text-ink-3 block mt-1 truncate">
                  {paths[f.filename]}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}

      <button
        type="button"
        onClick={handleRefresh}
        disabled={isPending}
        className="btn-ghost"
      >
        {isPending ? 'Refreshing' : 'Refresh all'}
      </button>
    </Panel>
  );
}
