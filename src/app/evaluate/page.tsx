import { EvaluateForm } from '@/components/evaluate/evaluate-form';
import { getAiMode } from '@/lib/queries/compass';
import { getVersionLabelMap } from '@/lib/queries/source-files';
import { PageHeader } from '@/components/layout/editorial';
import Link from 'next/link';

export default function EvaluatePage() {
  const aiMode = getAiMode();
  const versionLabels = getVersionLabelMap();

  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="II. Evaluate"
        title="Score a"
        tail="new posting."
        subtitle="Paste the text. Let the compass hold it against everything you care about and report back."
        action={
          <div className="text-right font-serif italic text-[12px] text-ink-2">
            <div>
              Using{' '}
              <span className="text-ink not-italic font-mono text-[11px]">
                {aiMode === 'cli' ? 'Claude CLI' : aiMode === 'local' ? 'Local model' : 'Anthropic API'}
              </span>
            </div>
            <Link
              href="/settings"
              className="hover:text-stamp transition-colors"
            >
              change in Settings →
            </Link>
          </div>
        }
      />

      <div className="rise" style={{ animationDelay: '100ms' }}>
        <EvaluateForm aiMode={aiMode} versionLabels={versionLabels} />
      </div>
    </div>
  );
}
