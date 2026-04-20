'use client';

import { useState, useEffect, useTransition } from 'react';
import { updateAiMode, checkApiKeyExists } from '@/actions/settings';
import { Panel } from '@/components/layout/editorial';
import type { AiMode } from '@/lib/types';

export function AiModeToggle({ initialMode }: { initialMode: AiMode }) {
  const [mode, setMode] = useState<AiMode>(initialMode);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    checkApiKeyExists().then(setHasApiKey);
  }, []);

  function handleToggle(newMode: AiMode) {
    if (newMode === mode) return;
    setSaved(false);
    setMode(newMode);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('ai_mode', newMode);
      await updateAiMode(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Panel
      title="AI Backend"
      description="Choose how evaluations and materials generation are processed."
      action={
        saved && (
          <span className="smallcaps text-[9px] text-stamp">Saved</span>
        )
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModeCard
          active={mode === 'api'}
          disabled={isPending}
          onClick={() => handleToggle('api')}
          title="Anthropic API"
          description="Pay-per-use. Structured JSON, faster, configurable model via ANTHROPIC_MODEL env var."
        />
        <ModeCard
          active={mode === 'cli'}
          disabled={isPending}
          onClick={() => handleToggle('cli')}
          title="Claude CLI"
          description="Uses your Max/Pro subscription. Runs `claude -p`. Slower, no API key needed."
        />
      </div>

      {mode === 'api' && !hasApiKey && (
        <p className="mt-4 font-serif italic text-[13px] text-stamp">
          ANTHROPIC_API_KEY not detected. Set it in .env.local and restart the dev server.
        </p>
      )}
    </Panel>
  );
}

function ModeCard({
  active,
  disabled,
  onClick,
  title,
  description,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  title: string;
  description: string;
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
      <div className="flex items-baseline gap-2 mb-2">
        {active && (
          <span className="font-serif text-stamp text-[14px] italic leading-none">✓</span>
        )}
        <span
          className={`font-serif text-[18px] leading-none ${
            active ? 'text-ink' : 'text-ink'
          }`}
          style={{ fontVariationSettings: '"opsz" 18, "SOFT" 50' }}
        >
          {title}
        </span>
      </div>
      <p
        className="font-serif italic text-[12px] text-ink-2 leading-snug"
        style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
      >
        {description}
      </p>
    </button>
  );
}
