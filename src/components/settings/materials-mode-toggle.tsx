'use client';

import { useState, useEffect, useTransition } from 'react';
import { updateMaterialsMode } from '@/actions/settings';
import { checkBaseResumes } from '@/actions/generate-materials';
import { Panel } from '@/components/layout/editorial';
import type { MaterialsMode } from '@/lib/types';

export function MaterialsModeToggle({ initialMode }: { initialMode: MaterialsMode }) {
  const [mode, setMode] = useState<MaterialsMode>(initialMode);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [missingResumes, setMissingResumes] = useState<string[]>([]);
  const [versionLabels, setVersionLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    checkBaseResumes().then((status) => {
      setMissingResumes(status.missing);
      setVersionLabels(status.versions);
    });
  }, []);

  function handleToggle(newMode: MaterialsMode) {
    if (newMode === mode) return;
    setSaved(false);
    setMode(newMode);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('materials_mode', newMode);
      await updateMaterialsMode(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Panel
      title="Materials Generation"
      description='Choose what gets generated when you click "Draft Materials" on a role.'
      action={saved && <span className="smallcaps text-[9px] text-stamp">Saved</span>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModeCard
          active={mode === 'full'}
          disabled={isPending}
          onClick={() => handleToggle('full')}
          title="Full resume + cover letter"
          description="Generates a tailored two-page resume, cover letter, and summary. Uses more tokens."
        />
        <ModeCard
          active={mode === 'summary'}
          disabled={isPending}
          onClick={() => handleToggle('summary')}
          title="Cover letter + summary only"
          description="Generates a cover letter and resume summary. Faster and cheaper."
        />
      </div>

      {mode === 'summary' && missingResumes.length > 0 && (
        <p className="mt-4 font-serif italic text-[12px] text-ink-2 leading-snug">
          Missing base resumes: {missingResumes.map((l) => `${l} (${versionLabels[l] || l})`).join(', ')}.
          You can generate them from any role's Materials page.
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
