import { redirect } from 'next/navigation';
import { isRitualAcknowledged, isFirstRun } from '@/lib/queries/onboarding';
import { BeginRitual } from '@/components/onboarding/begin-ritual';

export default function BeginPage() {
  // Returning users (content already loaded) have no business seeing the
  // ritual. Ritual is first-run only. Same for users who already acknowledged.
  if (!isFirstRun() || isRitualAcknowledged()) {
    redirect('/');
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 md:py-24">
      <BeginRitual />
    </div>
  );
}
