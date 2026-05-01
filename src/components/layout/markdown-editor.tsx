'use client';

import { useMemo } from 'react';
import { marked } from 'marked';

/**
 * Side-by-side markdown editor: textarea on the left, rendered HTML preview
 * on the right. Stacks on mobile (preview below). The component is fully
 * controlled — owners hold the markdown string and pass `value` + `onChange`.
 *
 * The preview is styled to feel like a printed document so users see what the
 * markdown will look like once exported (PDF rendering uses the same marked
 * pipeline, so visual parity is reasonable).
 */
export function MarkdownEditor({
  value,
  onChange,
  rows = 24,
  placeholder,
  monospaceEditor = true,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  placeholder?: string;
  monospaceEditor?: boolean;
  ariaLabel?: string;
}) {
  const html = useMemo(() => {
    try {
      return marked.parse(value || '', { async: false }) as string;
    } catch {
      return '';
    }
  }, [value]);

  const editorClass = monospaceEditor
    ? 'field w-full font-mono text-[12px] leading-[1.55] resize-y'
    : 'field w-full font-serif text-[14px] leading-[1.65] resize-y';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="smallcaps text-[9px] text-ink-3 mb-2">Markdown</div>
        <textarea
          aria-label={ariaLabel ?? 'Markdown editor'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={editorClass}
          style={!monospaceEditor ? { fontVariationSettings: '"opsz" 14, "SOFT" 30' } : undefined}
          spellCheck
        />
      </div>
      <div>
        <div className="smallcaps text-[9px] text-ink-3 mb-2">Preview</div>
        <div
          className="md-preview p-5 border border-rule bg-paper min-h-[10rem] overflow-y-auto"
          style={{ maxHeight: `calc(${rows * 1.55}em + 2.5rem)` }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
