'use client';

import { useState, useTransition } from 'react';
import {
  markContacted,
  updatePersonNotesAction,
  updatePersonUrlAction,
  deletePersonAction,
} from '@/actions/people';
import type { Person } from '@/lib/types';

function shortDate(iso: string): string {
  const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'));
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
}

export function PersonRow({
  person,
  needsAttention,
}: {
  person: Person;
  needsAttention: boolean;
}) {
  const [lastInteraction, setLastInteraction] = useState(person.last_interaction);
  const [attention, setAttention] = useState(needsAttention);
  const [notes, setNotes] = useState(person.notes || '');
  const [url, setUrl] = useState(person.url || '');
  const [expanded, setExpanded] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2000);
  }

  function handleMarkContacted() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('person_id', String(person.id));
      const result = await markContacted(formData);
      if (result.success) {
        const today = new Date().toISOString().split('T')[0];
        setLastInteraction(today);
        setAttention(false);
        showFeedback('Noted');
      }
    });
  }

  function handleSaveNotes() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('person_id', String(person.id));
      formData.set('notes', notes);
      await updatePersonNotesAction(formData);
      showFeedback('Saved');
    });
  }

  function handleSaveUrl() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('person_id', String(person.id));
      formData.set('url', url);
      await updatePersonUrlAction(formData);
      setEditingUrl(false);
      showFeedback('Saved');
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deletePersonAction(person.id);
      setDeleted(true);
    });
  }

  if (deleted) return null;

  return (
    <li className="py-5 px-1">
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-3 md:gap-6">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="min-w-0 flex-1 text-left cursor-pointer"
        >
          <div className="flex items-baseline gap-3 flex-wrap">
            {attention && (
              <span
                aria-hidden
                className="font-serif text-stamp text-[16px] leading-none italic"
                title="Needs attention"
              >
                ✦
              </span>
            )}
            <span
              className="font-serif text-[20px] leading-tight text-ink tracking-[-0.01em] hover:text-stamp transition-colors"
              style={{ fontVariationSettings: '"opsz" 20, "SOFT" 40' }}
            >
              {person.name}
            </span>
            {person.role && (
              <span
                className="font-serif italic text-[14px] text-ink-2"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 50' }}
              >
                {person.role}
              </span>
            )}
            {person.company && (
              <span
                className="font-serif italic text-[14px] text-ink-2"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
              >
                at {person.company}
              </span>
            )}
          </div>
          {person.why_they_matter && (
            <p
              className="mt-1.5 font-serif italic text-[13px] text-ink-2 leading-snug"
              style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
            >
              {person.why_they_matter}
            </p>
          )}
        </button>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 shrink-0">
          {feedback && <span className="smallcaps text-[9px] text-stamp">{feedback}</span>}
          {lastInteraction ? (
            <span
              className={`font-mono tabular text-[10px] ${
                attention ? 'text-stamp' : 'text-ink-3'
              }`}
            >
              last {shortDate(lastInteraction)}
            </span>
          ) : (
            <span className="font-mono tabular text-[10px] text-stamp">no contact</span>
          )}
          <button
            type="button"
            onClick={handleMarkContacted}
            disabled={isPending}
            className="font-mono text-[11px] text-ink-2 hover:text-stamp transition-colors disabled:opacity-50 cursor-pointer underline decoration-rule hover:decoration-stamp"
          >
            contacted today
          </button>
          {url && !editingUrl && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-serif italic text-[13px] text-ink-2 hover:text-stamp transition-colors"
              style={{ fontVariationSettings: '"opsz" 13, "SOFT" 50' }}
            >
              profile →
            </a>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 ml-0 border-t border-rule-soft pt-4 space-y-4 max-w-2xl">
          <div>
            <div className="smallcaps text-[9px] text-ink-3 mb-2">Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes…"
              className="field w-full font-serif text-[14px] leading-snug resize-y"
              style={{ fontVariationSettings: '"opsz" 14, "SOFT" 30' }}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isPending}
                className="btn-ghost"
              >
                {isPending ? 'Saving' : 'Save notes'}
              </button>
            </div>
          </div>

          <div>
            <div className="smallcaps text-[9px] text-ink-3 mb-2">Profile URL</div>
            {editingUrl ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveUrl();
                  }}
                  placeholder="https://…"
                  className="field flex-1"
                />
                <button
                  type="button"
                  onClick={handleSaveUrl}
                  disabled={isPending}
                  className="btn-ghost"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUrl(person.url || '');
                    setEditingUrl(false);
                  }}
                  className="btn-link"
                >
                  cancel
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-3">
                {url ? (
                  <span className="font-mono text-[11px] text-ink-2 truncate max-w-lg">
                    {url}
                  </span>
                ) : (
                  <span
                    className="font-serif italic text-[13px] text-ink-3"
                    style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
                  >
                    No URL set.
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setEditingUrl(true)}
                  className="btn-link"
                >
                  {url ? 'edit' : 'add'}
                </button>
              </div>
            )}
          </div>

          {/* Delete */}
          <div className="pt-2 border-t border-rule-soft flex items-center justify-between">
            {confirmDelete ? (
              <div className="flex items-center gap-3">
                <span
                  className="font-serif italic text-[13px] text-stamp"
                  style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
                >
                  Remove {person.name}?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="font-mono text-[11px] text-stamp hover:text-stamp-deep transition-colors disabled:opacity-50"
                >
                  yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="font-mono text-[11px] text-ink-3 hover:text-ink transition-colors"
                >
                  cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="font-mono text-[11px] text-ink-3 hover:text-stamp transition-colors cursor-pointer underline decoration-rule hover:decoration-stamp"
              >
                delete
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
