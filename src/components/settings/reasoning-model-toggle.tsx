'use client';

import { useState, useTransition } from 'react';
import { updateReasoningModel } from '@/actions/settings';
import { Panel } from '@/components/layout/editorial';
import { PRICING, formatUsd, estimateCost } from '@/lib/ai/pricing';

// Rough "typical" token counts for a single reasoning call — used only for the
// display-side cost comparison, not for actual billing.
const TYPICAL_INPUT_TOKENS = 6000;
const TYPICAL_OUTPUT_TOKENS = 2000;

export function ReasoningModelToggle({ initialModel }: { initialModel: string }) {
  const [model, setModel] = useState<string>(initialModel);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSelect(newModel: string) {
    if (newModel === model) return;
    setSaved(false);
    setModel(newModel);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('reasoning_model', newModel);
      await updateReasoningModel(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Panel
      title="Reasoning Model"
      description="Which Claude does the thinking. Sonnet for everything routine, Opus when judgment matters (Discovery, base resume generation). Per-search override lives on the Discover page."
      action={saved && <span className="smallcaps text-[9px] text-stamp">Saved</span>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(PRICING).map(([id, rates]) => {
          const estimate = estimateCost(id, TYPICAL_INPUT_TOKENS, TYPICAL_OUTPUT_TOKENS);
          return (
            <ModelCard
              key={id}
              active={model === id}
              disabled={isPending}
              onClick={() => handleSelect(id)}
              label={rates.label}
              modelId={id}
              inputRate={rates.input_per_mtok}
              outputRate={rates.output_per_mtok}
              estimatedCost={estimate}
            />
          );
        })}
      </div>
    </Panel>
  );
}

function ModelCard({
  active,
  disabled,
  onClick,
  label,
  modelId,
  inputRate,
  outputRate,
  estimatedCost,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
  modelId: string;
  inputRate: number;
  outputRate: number;
  estimatedCost: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-left p-5 border transition-all disabled:opacity-50 ${
        active
          ? 'border-ink bg-paper shadow-[2px_2px_0_var(--ink)]'
          : 'border-rule bg-paper-2/40 hover:border-ink-2'
      }`}
    >
      <div className="flex items-baseline gap-2 mb-1">
        {active && (
          <span className="font-serif text-stamp text-[14px] italic leading-none">✓</span>
        )}
        <span
          className="font-serif text-[18px] leading-none text-ink"
          style={{ fontVariationSettings: '"opsz" 18, "SOFT" 50' }}
        >
          {label}
        </span>
      </div>
      <div className="font-mono text-[10px] text-ink-3 mb-3">{modelId}</div>
      <div className="font-mono tabular text-[11px] text-ink-2 space-y-0.5">
        <div>
          input <span className="text-ink">${inputRate.toFixed(2)}</span>/M
        </div>
        <div>
          output <span className="text-ink">${outputRate.toFixed(2)}</span>/M
        </div>
        <div className="pt-1 text-ink-3">
          ~{formatUsd(estimatedCost)} per typical reasoning call
        </div>
      </div>
    </button>
  );
}
