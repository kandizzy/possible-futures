'use client';

import { useState, useTransition } from 'react';
import { updateCompassConfig } from '@/actions/settings';
import { Panel } from '@/components/layout/editorial';

interface CompassEditorProps {
  initialSignalWords: string[];
  initialRedFlagWords: string[];
  initialCompensationFloor: number;
}

function TagList({
  tags,
  onRemove,
  accent,
}: {
  tags: string[];
  onRemove: (tag: string) => void;
  accent: 'ink' | 'stamp';
}) {
  if (tags.length === 0) {
    return (
      <span
        className="font-serif italic text-[12px] text-ink-3"
        style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
      >
        None set.
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-baseline gap-1 font-serif italic text-[14px] ${
            accent === 'stamp' ? 'text-stamp' : 'text-ink'
          }`}
          style={{ fontVariationSettings: '"opsz" 14, "SOFT" 50' }}
        >
          “{tag}”
          <button
            type="button"
            onClick={() => onRemove(tag)}
            className="font-mono text-[10px] not-italic text-ink-3 hover:text-stamp transition-colors ml-0.5"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

function AddTagInput({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (tag: string) => void;
}) {
  const [value, setValue] = useState('');

  function handleAdd() {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue('');
    }
  }

  return (
    <div className="flex gap-2 mt-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
          }
        }}
        placeholder={placeholder}
        className="field flex-1"
      />
      <button type="button" onClick={handleAdd} className="btn-ghost">
        Add
      </button>
    </div>
  );
}

export function CompassEditor({
  initialSignalWords,
  initialRedFlagWords,
  initialCompensationFloor,
}: CompassEditorProps) {
  const [signalWords, setSignalWords] = useState<string[]>(initialSignalWords);
  const [redFlagWords, setRedFlagWords] = useState<string[]>(initialRedFlagWords);
  const [compensationFloor, setCompensationFloor] = useState(initialCompensationFloor);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function addSignalWord(word: string) {
    if (!signalWords.some((w) => w.toLowerCase() === word.toLowerCase())) {
      setSignalWords([...signalWords, word]);
    }
  }

  function addRedFlagWord(word: string) {
    if (!redFlagWords.some((w) => w.toLowerCase() === word.toLowerCase())) {
      setRedFlagWords([...redFlagWords, word]);
    }
  }

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('signal_words', JSON.stringify(signalWords));
      formData.set('red_flag_words', JSON.stringify(redFlagWords));
      formData.set('compensation_floor', String(compensationFloor));
      await updateCompassConfig(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Panel
      title="Compass Editor"
      description="Signal words, red flags, and the compensation floor. These shape every evaluation."
      action={saved && <span className="smallcaps text-[9px] text-stamp">Saved</span>}
    >
      <div className="space-y-7">
        <div>
          <label className="smallcaps text-[9px] text-ink-3 block mb-3">
            Signals ({signalWords.length})
          </label>
          <TagList
            tags={signalWords}
            onRemove={(tag) => setSignalWords(signalWords.filter((w) => w !== tag))}
            accent="ink"
          />
          <AddTagInput placeholder="Add a signal word…" onAdd={addSignalWord} />
        </div>

        <div>
          <label className="smallcaps text-[9px] text-ink-3 block mb-3">
            Red flags ({redFlagWords.length})
          </label>
          <TagList
            tags={redFlagWords}
            onRemove={(tag) => setRedFlagWords(redFlagWords.filter((w) => w !== tag))}
            accent="stamp"
          />
          <AddTagInput placeholder="Add a red flag word…" onAdd={addRedFlagWord} />
        </div>

        <div>
          <label className="smallcaps text-[9px] text-ink-3 block mb-3">
            Compensation floor
          </label>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-[18px] text-ink-2">$</span>
            <input
              type="number"
              value={compensationFloor}
              onChange={(e) => setCompensationFloor(Number(e.target.value))}
              min={0}
              step={5000}
              className="field w-48 font-mono tabular"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="btn-stamp"
        >
          {isPending ? 'Saving' : 'Save changes'}
        </button>
      </div>
    </Panel>
  );
}
