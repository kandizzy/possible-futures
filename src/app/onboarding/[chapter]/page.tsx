import { notFound } from 'next/navigation';
import { getOnboardingDraft } from '@/lib/queries/onboarding';
import type { IntakeChapter } from '@/lib/types';
import { Chapter1Setup } from '@/components/onboarding/chapters/chapter-1-setup';
import { Chapter2Throughline } from '@/components/onboarding/chapters/chapter-2-throughline';
import { Chapter3LookingFor } from '@/components/onboarding/chapters/chapter-3-looking-for';
import { Chapter4WontTolerate } from '@/components/onboarding/chapters/chapter-4-wont-tolerate';
import { Chapter5ShelfOfProof } from '@/components/onboarding/chapters/chapter-5-shelf-of-proof';

export default async function OnboardingChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter: chapterStr } = await params;
  const chapter = Number(chapterStr);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 5) {
    notFound();
  }

  const draft = getOnboardingDraft();
  const typedChapter = chapter as IntakeChapter;

  switch (typedChapter) {
    case 1:
      return <Chapter1Setup chapter={typedChapter} initialAnswers={draft.answers} />;
    case 2:
      return <Chapter2Throughline chapter={typedChapter} initialAnswers={draft.answers} />;
    case 3:
      return <Chapter3LookingFor chapter={typedChapter} initialAnswers={draft.answers} />;
    case 4:
      return <Chapter4WontTolerate chapter={typedChapter} initialAnswers={draft.answers} />;
    case 5:
      return <Chapter5ShelfOfProof chapter={typedChapter} initialAnswers={draft.answers} />;
  }
}
