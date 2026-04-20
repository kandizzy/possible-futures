'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { markRitualAcknowledged } from '@/lib/queries/onboarding';

export async function acknowledgeRitual(): Promise<void> {
  markRitualAcknowledged();
  revalidatePath('/', 'layout');
  redirect('/onboarding/1');
}
