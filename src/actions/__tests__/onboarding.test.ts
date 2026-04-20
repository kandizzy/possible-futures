import { describe, it, expect, vi, beforeEach } from 'vitest';
import { publishIntake, saveIntakeProgress } from '../onboarding';
import { getOnboardingDraft, getOnboardingState, saveOnboardingDraft } from '@/lib/queries/onboarding';
import { getSourceFile } from '@/lib/queries/source-files';
import { getCompassConfig } from '@/lib/queries/compass';
import type { IntakeAnswers } from '@/lib/types';

// Stub fs.writeFileSync so disk writes in publishIntake don't clutter the filesystem
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    writeFileSync: vi.fn(),
    default: { ...actual, writeFileSync: vi.fn() },
  };
});

function minimalAnswers(): IntakeAnswers {
  return {
    name: 'Jane Chen',
    email: 'jane@example.com',
    through_line: 'I make things that feel like instruments.',
    current_situation: 'Freshly out of grad school.',
    roles: [
      {
        id: 'r1',
        title: 'Design Engineer',
        company: 'Mirror',
        start: '2024',
        summary: 'Built a thing.',
        proudest: 'Shipped it.',
      },
    ],
    dream_role: 'Staff Design Engineer',
    signal_words: ['craft', 'typography'],
    red_flag_words: ['rockstar', 'ninja'],
    compensation_floor: 175000,
  };
}

describe('saveIntakeProgress', () => {
  it('stores answers and chapter in onboarding_draft', async () => {
    const formData = new FormData();
    formData.set('chapter', '2');
    formData.set('answers', JSON.stringify({ name: 'Jane' }));

    const res = await saveIntakeProgress(formData);
    expect(res.success).toBe(true);

    const draft = getOnboardingDraft();
    expect(draft.answers.name).toBe('Jane');
    expect(draft.current_chapter).toBe(2);
  });

  it('rejects invalid chapter numbers', async () => {
    const formData = new FormData();
    formData.set('chapter', '12');
    formData.set('answers', '{}');
    const res = await saveIntakeProgress(formData);
    expect(res.success).toBe(false);
  });

  it('rejects invalid JSON', async () => {
    const formData = new FormData();
    formData.set('chapter', '1');
    formData.set('answers', 'not json');
    const res = await saveIntakeProgress(formData);
    expect(res.success).toBe(false);
  });
});

describe('publishIntake', () => {
  beforeEach(() => {
    saveOnboardingDraft(minimalAnswers(), 5);
  });

  it('writes all three source files', async () => {
    const res = await publishIntake();
    expect(res.success).toBe(true);

    const book = getSourceFile('PROJECT_BOOK');
    const compass = getSourceFile('JOB_SEARCH_COMPASS.md');
    const playbook = getSourceFile('APPLICATION_PLAYBOOK.md');

    expect(book?.content).toContain('Jane Chen');
    expect(compass?.content).toContain('craft');
    expect(playbook?.content).toContain('## Resume Rules');
  });

  it('populates compass_config from the compiled markdown', async () => {
    await publishIntake();
    const config = getCompassConfig();
    expect(config).not.toBeNull();
    expect(config?.signal_words).toContain('craft');
    expect(config?.signal_words).toContain('typography');
    expect(config?.red_flag_words).toContain('rockstar');
    expect(config?.compensation_floor).toBe(175000);
  });

  it('marks onboarding state as complete', async () => {
    await publishIntake();
    const state = getOnboardingState();
    expect(state.completed_at).not.toBeNull();
    expect(state.published_by).toBe('intake');
  });

  it('refuses to publish a draft without a through-line', async () => {
    saveOnboardingDraft({ name: 'Jane' }, 1);
    const res = await publishIntake();
    expect(res.success).toBe(false);
  });
});
