import { getOnboardingDraft } from '@/lib/queries/onboarding';
import { compileIntake } from '@/lib/onboarding/compile';
import { PublishClient } from '@/components/onboarding/publish-client';

export default function PublishPage() {
  const draft = getOnboardingDraft();
  const compiled = compileIntake(draft.answers);
  return (
    <PublishClient
      answers={draft.answers}
      book={compiled.book}
      compass={compiled.compass}
      playbook={compiled.playbook}
    />
  );
}
