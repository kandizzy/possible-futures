'use client';

import { useState, useTransition } from 'react';
import { overrideRecommendation } from '@/actions/calibrate';
import { RECOMMENDATION_LABELS } from '@/lib/constants';
import type { Recommendation } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface Props {
  roleId: number;
  aiRecommendation: Recommendation;
  myRecommendation: Recommendation | null;
}

const STYLE: Record<Recommendation, string> = {
  apply: 'text-stamp italic font-semibold',
  stretch: 'text-ink italic',
  skip: 'text-ink-3 italic line-through decoration-ink-3/50',
};

export function RecommendationOverride({ roleId, aiRecommendation, myRecommendation }: Props) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const router = useRouter();

  const display = myRecommendation || aiRecommendation;

  function handleSubmit(formData: FormData) {
    setError('');
    startTransition(async () => {
      const res = await overrideRecommendation(formData);
      if (res.success) {
        setEditing(false);
        router.refresh();
      } else {
        setError(res.error || 'Failed');
      }
    });
  }

  if (editing) {
    return (
      <form action={handleSubmit} className="flex flex-wrap items-baseline gap-2">
        <input type="hidden" name="role_id" value={roleId} />
        <input type="hidden" name="ai_recommendation" value={aiRecommendation} />
        <select
          name="my_recommendation"
          defaultValue={myRecommendation || aiRecommendation}
          className="field font-serif italic text-[14px]"
          style={{ fontVariationSettings: '"opsz" 14, "SOFT" 50' }}
        >
          <option value="apply">apply</option>
          <option value="stretch">stretch</option>
          <option value="skip">skip</option>
        </select>
        <input
          name="reason"
          placeholder="reason"
          required
          className="field w-56"
        />
        <button type="submit" disabled={isPending} className="btn-stamp">
          {isPending ? '...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="btn-link"
        >
          cancel
        </button>
        {error && (
          <span className="font-serif italic text-[12px] text-stamp">{error}</span>
        )}
      </form>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-baseline gap-3 text-left hover:[&_.hint]:text-stamp"
      title="Click to change recommendation"
    >
      <span
        className={`font-serif text-[16px] ${STYLE[display]}`}
        style={{ fontVariationSettings: '"opsz" 16, "SOFT" 60' }}
      >
        {display}
      </span>
      <span
        className="hint font-serif italic text-[12px] text-ink-3 transition-colors"
        style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
      >
        {RECOMMENDATION_LABELS[display] || ''}
      </span>
      {myRecommendation && myRecommendation !== aiRecommendation && (
        <span className="font-mono tabular text-[9px] text-ink-3">
          (AI: {aiRecommendation})
        </span>
      )}
    </button>
  );
}
