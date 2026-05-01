'use client';

import { useState, useTransition } from 'react';
import { saveBaseResume, type BaseResumeFile } from '@/actions/settings';
import { Panel } from '@/components/layout/editorial';
import { MarkdownEditor } from '@/components/layout/markdown-editor';

export function BaseResumesEditor({ resumes }: { resumes: BaseResumeFile[] }) {
  const [openLetter, setOpenLetter] = useState<string | null>(null);

  return (
    <Panel
      title="Resume versions"
      description="Edit each base resume directly. The markdown on the left renders in the preview on the right and exports the same way to PDF."
    >
      <div className="space-y-3">
        {resumes.map((r) => (
          <ResumeRow
            key={r.letter}
            resume={r}
            isOpen={openLetter === r.letter}
            onToggle={() => setOpenLetter(openLetter === r.letter ? null : r.letter)}
          />
        ))}
        {resumes.length === 0 && (
          <p
            className="font-serif italic text-[13px] text-ink-2"
            style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
          >
            No resume versions defined yet. They&apos;re configured in your Application Playbook&apos;s Role-Type Emphasis Guide.
          </p>
        )}
      </div>
    </Panel>
  );
}

function ResumeRow({
  resume,
  isOpen,
  onToggle,
}: {
  resume: BaseResumeFile;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [content, setContent] = useState(resume.content);
  const [isSaving, startSaving] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const dirty = content !== resume.content;

  function handleSave() {
    setFeedback(null);
    startSaving(async () => {
      const fd = new FormData();
      fd.set('letter', resume.letter);
      fd.set('content', content);
      const result = await saveBaseResume(fd);
      if (result.success) {
        setFeedback({ kind: 'ok', text: 'Saved.' });
        setTimeout(() => setFeedback(null), 2000);
      } else {
        setFeedback({ kind: 'err', text: result.error ?? 'Could not save.' });
      }
    });
  }

  return (
    <div className="border border-rule bg-paper">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-baseline justify-between gap-4 p-4 text-left hover:bg-paper-2/40 transition-colors"
      >
        <div className="min-w-0 flex items-baseline gap-3">
          <span className="smallcaps text-[10px] text-ink-3 shrink-0">Version {resume.letter}</span>
          <span
            className="font-serif text-[18px] text-ink truncate"
            style={{ fontVariationSettings: '"opsz" 18, "SOFT" 50' }}
          >
            {resume.label}
          </span>
        </div>
        <div className="flex items-baseline gap-3 shrink-0">
          {!resume.exists && (
            <span className="font-serif italic text-[12px] text-stamp">not generated yet</span>
          )}
          {dirty && isOpen && (
            <span className="font-serif italic text-[12px] text-ink-2">unsaved changes</span>
          )}
          <span className="font-mono text-[10px] text-ink-3">{isOpen ? '−' : '+'}</span>
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-rule-soft space-y-4">
          {!resume.exists ? (
            <p
              className="font-serif italic text-[13px] text-ink-2"
              style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
            >
              No file on disk yet. Click &ldquo;Generate base resume&rdquo; on any role&apos;s Materials page to draft one,
              then come back here to edit.
            </p>
          ) : (
            <>
              <MarkdownEditor
                value={content}
                onChange={setContent}
                rows={28}
                ariaLabel={`Base resume — Version ${resume.letter}`}
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
                      setContent(resume.content);
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
