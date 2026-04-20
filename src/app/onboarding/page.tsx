import { redirect } from 'next/navigation';
import { getOnboardingDraft } from '@/lib/queries/onboarding';

export default function OnboardingIndexPage() {
  const draft = getOnboardingDraft();
  redirect(`/onboarding/${draft.current_chapter}`);
}
