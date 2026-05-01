'use client';

import { useState, useTransition } from 'react';
import { saveSourceFileContent } from '@/actions/settings';
import { Panel } from '@/components/layout/editorial';
import { MarkdownEditor } from '@/components/layout/markdown-editor';

export function SourceFileEditor({
  title,
  description,
  filename,
  initialContent,
  exists,
  rows = 28,
}: {
  title: string;
  description: string;
  filename: string;
  initialContent: string;
  exists: boolean;
  rows?: number;
}) {
  const [content, setContent] = useState(initialContent);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const dirty = content !== initialContent;

  function handleSave() {
    setFeedback(null);
    startSaving(async () => {
      const fd = new FormData();
      fd.set('filename', filename);
      fd.set('content', content);
      const result = await saveSourceFileContent(fd);
      if (result.success) {
        setFeedback({ kind: 'ok', text: 'Saved.' });
        setTimeout(() => setFeedback(null), 2000);
      } else {
        setFeedback({ kind: 'err', text: result.error ?? 'Could not save.' });
      }
    });
  }

  return (
    <Panel title={title} description={description}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-baseline justify-between gap-4 p-4 border border-rule bg-paper text-left hover:bg-paper-2/40 transition-colors"
      >
        <div className="min-w-0 flex items-baseline gap-3">
          <span className="font-mono text-[11px] text-ink-2">{filename}</span>
          {!exists && (
            <span className="font-serif italic text-[12px] text-stamp">no file on disk yet</span>
          )}
          {dirty && isOpen && (
            <span className="font-serif italic text-[12px] text-ink-2">unsaved changes</span>
          )}
        </div>
        <span className="font-mono text-[10px] text-ink-3">{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <MarkdownEditor
            value={content}
            onChange={setContent}
            rows={rows}
            ariaLabel={title}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !dirty}
              className="btn-stamp disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            {dirty && (
              <button
                type="button"
                onClick={() => {
                  setContent(initialContent);
                  setFeedback(null);
                }}
                disabled={isSaving}
                className="btn-ghost disabled:opacity-50"
              >
                Revert
              </button>
            )}
            {feedback && (
              <span
                className={`font-serif italic text-[13px] ${feedback.kind === 'ok' ? 'text-ink-2' : 'text-stamp'}`}
                style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
              >
                {feedback.text}
              </span>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
