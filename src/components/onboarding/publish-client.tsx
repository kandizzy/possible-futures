'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, useMemo } from 'react';
import { marked } from 'marked';
import { publishIntake } from '@/actions/onboarding';
import type { IntakeAnswers } from '@/lib/types';

interface Props {
  answers: IntakeAnswers;
  book: string;
  compass: string;
  playbook: string;
}

export function PublishClient({ answers, book, compass, playbook }: Props) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'error'; message: string }
    | { kind: 'done'; diskPaths: string[]; diskError?: string }
  >({ kind: 'idle' });
  const [tab, setTab] = useState<'book' | 'compass' | 'playbook'>('book');
  const [viewMode, setViewMode] = useState<'preview' | 'source' | 'edit'>('preview');
  const [editedBook, setEditedBook] = useState(book);
  const [editedCompass, setEditedCompass] = useState(compass);
  const [editedPlaybook, setEditedPlaybook] = useState(playbook);
  const router = useRouter();

  const content =
    tab === 'book' ? editedBook : tab === 'compass' ? editedCompass : editedPlaybook;
  const rendered = useMemo(() => marked.parse(content, { async: false }) as string, [content]);

  const dirty =
    editedBook !== book || editedCompass !== compass || editedPlaybook !== playbook;

  function setEditedContent(next: string) {
    if (tab === 'book') setEditedBook(next);
    else if (tab === 'compass') setEditedCompass(next);
    else setEditedPlaybook(next);
  }

  function resetCurrentTab() {
    if (tab === 'book') setEditedBook(book);
    else if (tab === 'compass') setEditedCompass(compass);
    else setEditedPlaybook(playbook);
  }

  function handlePublish() {
    setStatus({ kind: 'idle' });
    startTransition(async () => {
      const res = await publishIntake(
        dirty
          ? {
              book: editedBook,
              compass: editedCompass,
              playbook: editedPlaybook,
            }
          : undefined,
      );
      if (!res.success) {
        setStatus({ kind: 'error', message: res.error });
        return;
      }
      setStatus({
        kind: 'done',
        diskPaths: res.diskPaths || [],
        diskError: res.diskError,
      });
    });
  }

  function goToDashboard() {
    router.push('/');
  }

  const projectCount = answers.projects?.length || 0;
  const roleCount = answers.roles?.length || 0;
  const signalCount = answers.signal_words?.length || 0;

  return (
    <div className="space-y-10 pb-16">
      {/* Eyebrow */}
      <div className="smallcaps text-[10px] text-ink-3">First Printing · The Reveal</div>

      {/* Title */}
      <header>
        <h1
          className="font-serif text-[46px] sm:text-[60px] md:text-[80px] leading-[0.85] text-ink tracking-[-0.03em]"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
        >
          Press the plates.
          <br />
          <span
            className="italic text-stamp"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}
          >
            It&apos;s ready.
          </span>
        </h1>
        <p
          className="mt-5 font-serif text-[17px] md:text-[19px] text-ink-2 italic leading-snug max-w-2xl"
          style={{ fontVariationSettings: '"opsz" 19, "SOFT" 40' }}
        >
          {answers.name ? `${answers.name}, ` : ''}
          your first edition is composed. {roleCount} roles on the shelf,{' '}
          {projectCount} projects of proof, {signalCount} signal words tuned. Have a
          final look, then send it to the press.
        </p>
      </header>

      {/* Stats strip */}
      <div className="flex flex-wrap items-baseline gap-x-10 gap-y-6 pt-6 border-t border-b border-rule py-6">
        <Stat label="Roles" value={roleCount} />
        <Divider />
        <Stat label="Projects" value={projectCount} />
        <Divider />
        <Stat label="Signal words" value={signalCount} />
        <Divider />
        <Stat label="Red flags" value={answers.red_flag_words?.length || 0} />
        {answers.compensation_floor != null && answers.compensation_floor > 0 ? (
          <>
            <Divider />
            <Stat
              label="Floor"
              value={answers.compensation_floor >= 1000
                ? `$${(answers.compensation_floor / 1000).toFixed(0)}k`
                : `$${answers.compensation_floor}`}
            />
          </>
        ) : null}
      </div>

      {/* Tabs + preview */}
      <section>
        <div className="smallcaps text-[9px] text-ink-3 mb-3">Preview the finished book</div>
        <div className="flex items-baseline gap-6 pb-3 border-b border-rule mb-4">
          {(['book', 'compass', 'playbook'] as const).map((key) => {
            const label =
              key === 'book'
                ? 'Part I — The Book'
                : key === 'compass'
                  ? 'Part II — The Compass'
                  : 'Part III — The Playbook';
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className="relative"
              >
                <span
                  className={`font-serif text-[15px] md:text-[17px] transition-colors ${
                    active ? 'text-stamp italic' : 'text-ink-2 hover:text-ink'
                  }`}
                  style={{
                    fontVariationSettings: active
                      ? '"opsz" 17, "SOFT" 60'
                      : '"opsz" 17',
                  }}
                >
                  {label}
                </span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-stamp"
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mb-4">
          {(['preview', 'source', 'edit'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 font-mono text-[11px] border transition-colors capitalize ${
                viewMode === mode
                  ? 'border-ink bg-paper text-ink shadow-[2px_2px_0_var(--ink)]'
                  : 'border-rule bg-paper-2/40 text-ink-3 hover:border-ink-2 hover:text-ink'
              }`}
            >
              {mode}
            </button>
          ))}
          {dirty && (
            <span
              className="ml-2 font-serif italic text-[12px] text-stamp"
              style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
            >
              edited — will be published instead of the auto-compiled version
            </span>
          )}
        </div>
        {viewMode === 'edit' ? (
          <div className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={20}
              className="field w-full font-mono text-[12px] leading-[1.55] resize-y"
              aria-label={`Edit ${tab}`}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={resetCurrentTab}
                className="font-serif italic text-[12px] text-ink-3 hover:text-stamp transition-colors"
                style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
              >
                Reset this tab to compiled
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8 bg-paper-2/40 border border-rule max-h-[440px] overflow-y-auto">
            {viewMode === 'preview' ? (
              <div
                className="prose prose-sm max-w-none text-ink prose-headings:font-serif prose-headings:tracking-tight prose-headings:text-ink prose-strong:text-ink prose-a:text-stamp"
                dangerouslySetInnerHTML={{ __html: rendered }}
              />
            ) : (
              <pre
                className="font-mono text-[12px] leading-[1.65] text-ink-2 whitespace-pre-wrap"
              >
                {content}
              </pre>
            )}
          </div>
        )}
        {tab === 'playbook' && (
          <p
            className="mt-3 font-serif italic text-[12px] text-ink-2"
            style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
          >
            The playbook starts with sensible defaults and your red flags and banned words.
            It gets sharper as you apply to real roles and learn what works.
          </p>
        )}
        <p
          className="mt-2 font-serif italic text-[12px] text-ink-3"
          style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
        >
          Switch to <span className="not-italic font-mono text-[11px] text-ink-2">Edit</span>{' '}
          to refine any of the three documents directly before publishing — useful for
          adding rules the intake didn&apos;t ask about. Keep the existing heading structure
          (## and ###) intact, as the app parses it to populate your compass. Heads up:
          re-running Revise will recompile from your intake answers and overwrite these
          edits, so you can also edit afterward in Settings.
        </p>
        <details className="mt-3">
          <summary className="font-mono text-[11px] text-ink-3 hover:text-stamp transition-colors cursor-pointer">
            Prompt for editing with AI
          </summary>
          <div className="mt-2 p-4 bg-paper-2/60 border border-rule font-mono text-[11px] text-ink-2 leading-relaxed whitespace-pre-wrap select-all">
{`I'm going to paste a markdown document that is parsed by an app called Possible Futures. The app reads ## and ### headings to extract structured data (roles, projects, versions, contact info). Help me edit the content while following these rules:

1. Never rename, remove, or reorder ## or ### section headings
2. Keep the **Bold Label:** pattern for fields like **Name:**, **Email:**, **Tech:**, etc.
3. Role entries must stay as: ### Title | Company followed by **Date Range**
4. You can freely edit body text, bullet points, and add new content within sections
5. Do not add new ## sections unless I ask you to

Here is the document:`}
          </div>
        </details>
      </section>

      {/* Error */}
      {status.kind === 'error' && (
        <div className="border-l-2 border-stamp pl-4">
          <p
            className="font-serif italic text-[14px] text-stamp"
            style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
          >
            {status.message}
          </p>
        </div>
      )}

      {/* Success */}
      {status.kind === 'done' && (
        <div className="p-6 border border-rule bg-paper-2/40 space-y-4">
          <div className="smallcaps text-[9px] text-stamp">Published</div>
          <p
            className="font-serif text-[17px] text-ink leading-snug"
            style={{ fontVariationSettings: '"opsz" 17, "SOFT" 30' }}
          >
            Your first edition has been set. Possible Futures is primed and ready.
          </p>
          {status.diskPaths.length > 0 && (
            <div>
              <div className="smallcaps text-[8px] text-ink-3 mb-2">Saved to disk</div>
              <ul className="font-mono tabular text-[11px] text-ink-2 space-y-1">
                {status.diskPaths.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {status.diskError && (
            <p
              className="font-serif italic text-[13px] text-ink-3"
              style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
            >
              (Disk write skipped: {status.diskError}. Your content is still saved in the app.)
            </p>
          )}
          <div className="pt-2">
            <button type="button" onClick={goToDashboard} className="btn-stamp">
              Open Possible Futures →
            </button>
          </div>
        </div>
      )}

      {/* Footer actions */}
      {status.kind !== 'done' && (
        <div className="flex items-center justify-between pt-8 border-t border-rule">
          <Link href="/onboarding/5" className="btn-link">
            ← back to the last chapter
          </Link>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="btn-stamp disabled:opacity-50"
          >
            {isPending ? 'Pressing the plates…' : 'Publish →'}
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div
        className="font-serif tabular text-[34px] md:text-[40px] leading-none tracking-tight text-ink"
        style={{ fontVariationSettings: '"opsz" 48, "SOFT" 40' }}
      >
        {typeof value === 'number' ? String(value).padStart(2, '0') : value}
      </div>
      <div className="smallcaps text-[8px] text-ink-3 mt-2">{label}</div>
    </div>
  );
}

function Divider() {
  return <div className="hidden sm:block h-8 md:h-10 w-px bg-rule shrink-0" />;
}
