'use client';

import { useState, useTransition } from 'react';
import { overrideScore } from '@/actions/calibrate';
import { DIMENSION_LABELS } from '@/lib/constants';
import { getDimScoreColor } from '@/lib/types';
import type { Dimension, ScoreDimension } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface Props {
  roleId: number;
  dimension: Dimension;
  aiScore: ScoreDimension;
  myScore: number | undefined;
}

export function ScoreOverride({ roleId, dimension, aiScore, myScore }: Props) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const router = useRouter();

  const displayScore = myScore ?? aiScore.score;
  const hasOverride = myScore !== undefined && myScore !== null;
  const delta = hasOverride ? myScore - aiScore.score : null;
  const scoreCls = getDimScoreColor(displayScore);

  function handleSubmit(formData: FormData) {
    setError('');
    startTransition(async () => {
      const res = await overrideScore(formData);
      if (res.success) {
        setEditing(false);
        router.refresh();
      } else {
        setError(res.error || 'Failed');
      }
    });
  }

  return (
    <div className="p-5 bg-paper-2/50 border border-rule-soft relative group hover:border-rule transition-colors">
      {/* Plaque header */}
      <div className="flex items-baseline justify-between mb-3">
        <span className="smallcaps text-[10px] text-ink-2">
          {DIMENSION_LABELS[dimension]}
        </span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="font-serif italic text-[11px] text-ink-3 hover:text-stamp transition-colors opacity-0 group-hover:opacity-100"
          >
            edit →
          </button>
        )}
      </div>

      {/* Big score */}
      <div className="flex items-baseline gap-2 mb-3">
        <span
          className={`font-serif tabular text-[44px] leading-none ${scoreCls} tracking-tight`}
          style={{ fontVariationSettings: '"opsz" 60, "SOFT" 40' }}
        >
          {displayScore}
        </span>
        <span className="font-mono tabular text-[10px] text-ink-3">/3</span>
        {delta !== null && delta !== 0 && (
          <span
            className={`font-mono tabular text-[11px] ml-1 ${
              delta > 0 ? 'text-stamp' : 'text-ink-2'
            }`}
          >
            ({delta > 0 ? '+' : ''}
            {delta})
          </span>
        )}
      </div>

      {/* Rationale */}
      <p
        className="font-serif text-[13px] text-ink-2 leading-[1.55] italic"
        style={{ fontVariationSettings: '"opsz" 13, "SOFT" 30' }}
      >
        {aiScore.rationale}
      </p>

      {hasOverride && (
        <p className="mt-2 font-mono tabular text-[9px] text-ink-3">
          AI said {aiScore.score} · you said {myScore}
        </p>
      )}

      {editing && (
        <form
          action={handleSubmit}
          className="mt-4 pt-4 border-t border-rule-soft space-y-3"
        >
          <input type="hidden" name="role_id" value={roleId} />
          <input type="hidden" name="dimension" value={dimension} />
          <input type="hidden" name="ai_score" value={aiScore.score} />

          <div className="flex items-baseline gap-3">
            <label className="smallcaps text-[8px] text-ink-3 w-20">Your score</label>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((s) => (
                <label key={s} className="cursor-pointer">
                  <input
                    type="radio"
                    name="my_score"
                    value={s}
                    defaultChecked={s === (myScore ?? aiScore.score)}
                    className="sr-only peer"
                  />
                  <span className="inline-flex items-center justify-center w-8 h-8 border border-rule text-[13px] font-mono tabular text-ink-2 peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper transition-all">
                    {s}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <input
            name="reason"
            placeholder="Why are you changing this?"
            required
            className="field w-full"
          />

          {error && (
            <p className="font-serif italic text-[12px] text-stamp">{error}</p>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="btn-stamp">
              {isPending ? 'Saving' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError('');
              }}
              className="btn-link"
            >
              cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
