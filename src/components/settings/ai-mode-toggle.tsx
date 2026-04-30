'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  updateAiMode,
  updateLocalConfig,
  fetchLocalModels,
  checkApiKeyExists,
} from '@/actions/settings';
import { Panel } from '@/components/layout/editorial';
import type { AiMode } from '@/lib/types';

interface LocalConfig {
  base_url: string;
  model: string;
  api_key: string | null;
}

export function AiModeToggle({
  initialMode,
  initialLocalConfig,
}: {
  initialMode: AiMode;
  initialLocalConfig: LocalConfig;
}) {
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <ModeCard
          active={mode === 'local'}
          disabled={isPending}
          onClick={() => handleToggle('local')}
          title="Local model"
          description="Connect to LM Studio, Ollama, or any OpenAI-compatible endpoint. Zero per-call cost. Quality depends on the model."
        />
      </div>

      {mode === 'api' && !hasApiKey && (
        <p className="mt-4 font-serif italic text-[13px] text-stamp">
          ANTHROPIC_API_KEY not detected. Set it in .env.local and restart the dev server.
        </p>
      )}

      {mode === 'local' && <LocalConfigForm initial={initialLocalConfig} />}
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
          className="font-serif text-[18px] leading-none text-ink"
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

function LocalConfigForm({ initial }: { initial: LocalConfig }) {
  const [baseUrl, setBaseUrl] = useState(initial.base_url);
  const [model, setModel] = useState(initial.model);
  const [apiKey, setApiKey] = useState(initial.api_key ?? '');
  const [isSaving, startSaving] = useTransition();
  const [isFetching, startFetching] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [discoveredModels, setDiscoveredModels] = useState<string[] | null>(null);

  function handleSave() {
    setFeedback(null);
    startSaving(async () => {
      const fd = new FormData();
      fd.set('local_base_url', baseUrl);
      fd.set('local_model', model);
      fd.set('local_api_key', apiKey);
      const result = await updateLocalConfig(fd);
      if (result.success) {
        setFeedback({ kind: 'ok', text: 'Saved.' });
        setTimeout(() => setFeedback(null), 2000);
      } else {
        setFeedback({ kind: 'err', text: result.error ?? 'Could not save.' });
      }
    });
  }

  function handleFetchModels() {
    setFeedback(null);
    startFetching(async () => {
      const fd = new FormData();
      fd.set('local_base_url', baseUrl);
      fd.set('local_api_key', apiKey);
      const result = await fetchLocalModels(fd);
      if (result.success) {
        setDiscoveredModels(result.models);
        if (result.models.length === 0) {
          setFeedback({ kind: 'err', text: 'Server reachable, but no models loaded.' });
        } else if (!model && result.models.length > 0) {
          setModel(result.models[0]);
          setFeedback({ kind: 'ok', text: `Found ${result.models.length} model(s). Selected the first.` });
        } else {
          setFeedback({ kind: 'ok', text: `Found ${result.models.length} model(s).` });
        }
      } else {
        setFeedback({ kind: 'err', text: result.error ?? 'Could not reach server.' });
      }
    });
  }

  return (
    <div className="mt-6 pt-6 border-t border-rule-soft space-y-4">
      <div className="smallcaps text-[9px] text-ink-3">Local server</div>
      <Field label="Base URL" hint="LM Studio: http://localhost:1234/v1 · Ollama: http://localhost:11434/v1">
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="field font-mono text-[12px] w-full"
          placeholder="http://localhost:1234/v1"
        />
      </Field>
      <Field label="Model" hint="The model identifier loaded in your server. Use Fetch models to list what's available.">
        {discoveredModels && discoveredModels.length > 0 ? (
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="field font-mono text-[12px] w-full"
          >
            <option value="">— select a model —</option>
            {discoveredModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="field font-mono text-[12px] w-full"
            placeholder="qwen2.5-coder-14b-instruct"
          />
        )}
      </Field>
      <Field label="API key" hint="Optional. Most local servers ignore this; some require any non-empty value.">
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="field font-mono text-[12px] w-full"
          placeholder="(leave blank for LM Studio)"
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isFetching}
          className="btn-stamp disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={handleFetchModels}
          disabled={isSaving || isFetching}
          className="btn-ghost disabled:opacity-50"
        >
          {isFetching ? 'Fetching…' : 'Fetch models'}
        </button>
        {feedback && (
          <span
            className={`font-serif italic text-[13px] ${feedback.kind === 'ok' ? 'text-ink-2' : 'text-stamp'}`}
            style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
          >
            {feedback.text}
          </span>
        )}
      </div>

      <p
        className="font-serif italic text-[12px] text-ink-3 leading-snug max-w-2xl"
        style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
      >
        Each scoring call sends the full Book + Compass to the local server (about 30–40K
        tokens), so load the model with a context length of{' '}
        <span className="not-italic font-mono text-[11px] text-ink-2">32K or higher</span>.
        Tested working with Gemma 4 E4B; larger models score with more nuance. Cache control is
        Anthropic-only, so expect slower discovery sweeps than the API.
      </p>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="smallcaps text-[9px] text-ink-3 mb-1">{label}</div>
      {children}
      {hint && (
        <div
          className="mt-1 font-serif italic text-[11px] text-ink-3 leading-snug"
          style={{ fontVariationSettings: '"opsz" 11, "SOFT" 40' }}
        >
          {hint}
        </div>
      )}
    </label>
  );
}
