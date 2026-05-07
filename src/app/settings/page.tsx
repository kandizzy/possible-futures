import Link from 'next/link';
import { getSettings, getSourceFilePaths, getBaseResumes, getSourceFileContent } from '@/actions/settings';
import { getAllSourceFiles } from '@/lib/queries/source-files';
import { getOnboardingState } from '@/lib/queries/onboarding';
import { AiModeToggle } from '@/components/settings/ai-mode-toggle';
import { MaterialsModeToggle } from '@/components/settings/materials-mode-toggle';
import { ReasoningModelToggle } from '@/components/settings/reasoning-model-toggle';
import { CompassEditor } from '@/components/settings/compass-editor';
import { SourceFilesRefresh } from '@/components/settings/source-files-refresh';
import { BaseResumesEditor } from '@/components/settings/base-resumes-editor';
import { SourceFileEditor } from '@/components/settings/source-file-editor';
import { DateFormatToggle } from '@/components/settings/date-format-toggle';
import { PageHeader, Panel } from '@/components/layout/editorial';
import { formatDate } from '@/lib/format-date';
import type { AiMode, MaterialsMode } from '@/lib/types';

export default async function SettingsPage() {
  const settings = await getSettings();
  const sourceFiles = getAllSourceFiles();
  const sourceFilePaths = await getSourceFilePaths();
  const onboardingState = getOnboardingState();
  const baseResumes = await getBaseResumes();
  const compassFile = await getSourceFileContent('JOB_SEARCH_COMPASS.md');
  const playbookFile = await getSourceFileContent('APPLICATION_PLAYBOOK.md');

  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="VIII. Settings"
        title="House rules"
        tail="& instruments."
        subtitle="The backend, the compass, and the paper stock. Everything that shapes what gets made."
      />

      <div className="space-y-8 rise" style={{ animationDelay: '80ms' }}>
        <Panel
          title="First Printing"
          description="Walk through the interactive intake to compose or rewrite your Book, Compass, and Playbook."
          action={
            onboardingState.completed_at && (
              <span className="smallcaps text-[9px] text-ink-3">
                Last printed {formatDate(onboardingState.completed_at, settings.date_format)}
              </span>
            )
          }
        >
          <div className="flex flex-wrap items-baseline gap-4">
            <Link href="/onboarding/1" className="btn-stamp">
              {onboardingState.completed_at ? 'Reprint the first edition →' : 'Start the intake →'}
            </Link>
            <p
              className="font-serif italic text-[13px] text-ink-2 leading-snug max-w-md"
              style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
            >
              Five chapters, about ten minutes. Everything you enter is saved as you go — you
              can leave and come back.
            </p>
          </div>
          <DateFormatToggle initialFormat={settings.date_format} />
        </Panel>

        <AiModeToggle
          initialMode={settings.ai_mode as AiMode}
          initialLocalConfig={{
            base_url: settings.local_base_url,
            model: settings.local_model,
            api_key: settings.local_api_key,
          }}
        />
        <ReasoningModelToggle initialModel={settings.reasoning_model} />
        <MaterialsModeToggle initialMode={settings.materials_mode as MaterialsMode} />
        <CompassEditor
          initialSignalWords={settings.signal_words}
          initialRedFlagWords={settings.red_flag_words}
          initialCompensationFloor={settings.compensation_floor}
        />
        {compassFile && (
          <SourceFileEditor
            title="Compass markdown"
            description="Edit the full Compass markdown directly. Saving rewrites JOB_SEARCH_COMPASS.md and refreshes the source-file cache so the next AI call uses your changes."
            filename="JOB_SEARCH_COMPASS.md"
            initialContent={compassFile.content}
            exists={compassFile.exists}
          />
        )}
        {playbookFile && (
          <SourceFileEditor
            title="Playbook"
            description="Resume rules, cover-letter rules, the Things-to-Never-Do list, and the Role-Type Emphasis Guide. The AI reads this on every materials generation."
            filename="APPLICATION_PLAYBOOK.md"
            initialContent={playbookFile.content}
            exists={playbookFile.exists}
          />
        )}
        <BaseResumesEditor resumes={baseResumes} />
        <SourceFilesRefresh
          initialFiles={sourceFiles.map(f => ({ filename: f.filename, last_loaded_at: f.last_loaded_at }))}
          paths={sourceFilePaths}
        />
      </div>
    </div>
  );
}
