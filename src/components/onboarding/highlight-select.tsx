'use client';

interface Props {
  paragraph: string;
  phrases: string[];
  selected: string[];
  onToggle: (phrase: string) => void;
}

/**
 * Renders a paragraph with specific phrases as toggle buttons. The student
 * clicks phrases that "sound like them" — those selections feed into the
 * Book's voice calibration section.
 */
export function HighlightSelect({ paragraph, phrases, selected, onToggle }: Props) {
  // Split paragraph into segments, alternating plain text and clickable phrases.
  const segments: Array<{ text: string; phrase?: string }> = [];
  let remaining = paragraph;

  // Sort phrases by position in paragraph so we replace them in order
  const positioned = phrases
    .map((p) => ({ p, idx: paragraph.indexOf(p) }))
    .filter((x) => x.idx !== -1)
    .sort((a, b) => a.idx - b.idx);

  let cursor = 0;
  for (const { p, idx } of positioned) {
    if (idx > cursor) {
      segments.push({ text: paragraph.slice(cursor, idx) });
    }
    segments.push({ text: p, phrase: p });
    cursor = idx + p.length;
  }
  if (cursor < paragraph.length) {
    segments.push({ text: paragraph.slice(cursor) });
  }
  // If no phrases matched, fall back to just the paragraph
  if (segments.length === 0) {
    segments.push({ text: paragraph });
  }
  void remaining;

  return (
    <div>
      <p
        className="font-serif text-[17px] md:text-[19px] leading-[1.65] text-ink-2 max-w-2xl"
        style={{ fontVariationSettings: '"opsz" 19, "SOFT" 30' }}
      >
        {segments.map((seg, i) => {
          if (!seg.phrase) {
            return <span key={i}>{seg.text}</span>;
          }
          const isSelected = selected.includes(seg.phrase);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onToggle(seg.phrase!)}
              className={`inline transition-colors ${
                isSelected
                  ? 'text-stamp italic font-medium'
                  : 'text-ink-2 italic underline decoration-rule decoration-1 underline-offset-4 hover:text-ink hover:decoration-ink-3'
              }`}
              style={{
                fontVariationSettings: isSelected
                  ? '"opsz" 19, "SOFT" 80'
                  : '"opsz" 19, "SOFT" 40',
              }}
            >
              {seg.text}
            </button>
          );
        })}
      </p>
      {selected.length > 0 && (
        <p className="mt-4 smallcaps text-[9px] text-ink-3">
          {selected.length} {selected.length === 1 ? 'phrase' : 'phrases'} marked as your voice
        </p>
      )}
    </div>
  );
}
