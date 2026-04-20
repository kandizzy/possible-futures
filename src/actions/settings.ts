'use server';

import { revalidatePath } from 'next/cache';
import { setAiMode, setMaterialsMode, getCompassConfig, getAiMode, upsertCompassConfig, setReasoningModel } from '@/lib/queries/compass';
import { PRICING } from '@/lib/ai/pricing';
import { getSourceFile, getResumeVersionLabels, upsertSourceFile, getAllSourceFiles } from '@/lib/queries/source-files';
import { parseCompass } from '@/lib/parsers/compass';
import { getModel } from '@/lib/ai/client';
import { callAiApi, callAiCli } from '@/lib/ai/call';
import { extractNameFromBook, deriveBookFilename } from '@/lib/user-name';
import fs from 'fs';
import path from 'path';
import type { AiMode, MaterialsMode } from '@/lib/types';

export async function getSourceFilePaths(): Promise<Record<string, string>> {
  const parentDir = path.resolve(process.cwd(), '..');
  const storedBook = getSourceFile('PROJECT_BOOK');
  const bookFilename =
    process.env.PROJECT_BOOK ||
    deriveBookFilename(extractNameFromBook(storedBook?.content));
  return {
    'JOB_SEARCH_COMPASS.md': path.join(parentDir, 'JOB_SEARCH_COMPASS.md'),
    'PROJECT_BOOK': path.join(parentDir, bookFilename),
    'APPLICATION_PLAYBOOK.md': path.join(parentDir, 'APPLICATION_PLAYBOOK.md'),
    'CLAUDE.md': path.join(parentDir, 'CLAUDE.md'),
  };
}

export async function updateAiMode(formData: FormData): Promise<{ success: boolean; mode: AiMode }> {
  const mode = formData.get('ai_mode') as AiMode;
  if (mode !== 'api' && mode !== 'cli') {
    return { success: false, mode: 'api' };
  }
  setAiMode(mode);
  revalidatePath('/settings');
  return { success: true, mode };
}

export async function updateMaterialsMode(formData: FormData): Promise<{ success: boolean; mode: MaterialsMode }> {
  const mode = formData.get('materials_mode') as MaterialsMode;
  if (mode !== 'full' && mode !== 'summary') {
    return { success: false, mode: 'summary' };
  }
  setMaterialsMode(mode);
  revalidatePath('/settings');
  return { success: true, mode };
}

export async function checkApiKeyExists(): Promise<boolean> {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function getSettings() {
  const config = getCompassConfig();
  return {
    ai_mode: config?.ai_mode || 'api',
    materials_mode: config?.materials_mode || 'summary',
    reasoning_model: config?.reasoning_model || 'claude-sonnet-4-6',
    signal_words: config?.signal_words || [],
    red_flag_words: config?.red_flag_words || [],
    compensation_floor: config?.compensation_floor || 150000,
  };
}

export async function updateReasoningModel(formData: FormData): Promise<{ success: boolean; model: string }> {
  const model = formData.get('reasoning_model') as string;
  if (!model || !PRICING[model]) {
    return { success: false, model: '' };
  }
  setReasoningModel(model);
  revalidatePath('/settings');
  return { success: true, model };
}

export async function updateCompassConfig(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const signalWordsJson = formData.get('signal_words') as string;
  const redFlagWordsJson = formData.get('red_flag_words') as string;
  const compensationFloor = Number(formData.get('compensation_floor'));

  if (!signalWordsJson || !redFlagWordsJson || isNaN(compensationFloor) || compensationFloor < 0) {
    return { success: false, error: 'Invalid data.' };
  }

  try {
    const signal_words: string[] = JSON.parse(signalWordsJson);
    const red_flag_words: string[] = JSON.parse(redFlagWordsJson);
    upsertCompassConfig({ signal_words, red_flag_words, compensation_floor: compensationFloor });
    revalidatePath('/settings');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to save compass config.' };
  }
}

export async function refreshSourceFiles(): Promise<{
  success: boolean;
  files: Array<{ filename: string; last_loaded_at: string }>;
  error?: string;
}> {
  const sourceFiles = await getSourceFilePaths();

  const errors: string[] = [];

  for (const [filename, filepath] of Object.entries(sourceFiles)) {
    try {
      if (!fs.existsSync(filepath)) {
        errors.push(`${filename}: not found`);
        continue;
      }
      const content = fs.readFileSync(filepath, 'utf-8');
      upsertSourceFile(filename, content);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`${filename}: ${msg}`);
    }
  }

  // Re-parse compass to update config
  const compassFile = getSourceFile('JOB_SEARCH_COMPASS.md');
  if (compassFile) {
    try {
      const parsed = parseCompass(compassFile.content);
      upsertCompassConfig({
        signal_words: parsed.signal_words,
        red_flag_words: parsed.red_flag_words,
        compensation_floor: parsed.compensation_floor,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Compass parse: ${msg}`);
    }
  }

  const allFiles = getAllSourceFiles();
  const filesSummary = allFiles.map(f => ({ filename: f.filename, last_loaded_at: f.last_loaded_at }));

  if (errors.length > 0) {
    return { success: false, files: filesSummary, error: errors.join('; ') };
  }

  return { success: true, files: filesSummary };
}

export async function generateBaseResumesAction(
  versions: string[]
): Promise<{ success: boolean; generated: string[]; error?: string }> {
  const book = getSourceFile('PROJECT_BOOK');
  const playbook = getSourceFile('APPLICATION_PLAYBOOK.md');

  if (!book || !playbook) {
    return { success: false, generated: [], error: 'Book or Playbook not loaded. Run the seed script first.' };
  }

  const versionLabels = getResumeVersionLabels();
  const versionsDir = path.join(process.cwd(), '..', 'versions');

  try {
    if (!fs.existsSync(versionsDir)) {
      fs.mkdirSync(versionsDir, { recursive: true });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, generated: [], error: `Failed to create versions directory: ${message}` };
  }

  const aiMode = getAiMode();
  const generated: string[] = [];

  for (const letter of versions) {
    const label = versionLabels[letter] || `Version ${letter}`;

    const systemPrompt = `You are a resume writer. Generate a complete two-page resume in markdown format for the person described in their Project Book. This resume should emphasize their strengths for "${label}" roles as described in their Application Playbook's Role-Type Emphasis Guide.

Requirements:
- Two pages max when printed
- Include: name/contact header, a ## Summary section with 3-4 sentences, work experience with achievement-oriented bullets, selected projects, education, and skills
- The ## Summary section is critical — it will be replaced with a tailored version for each job application
- Follow all writing rules from the Project Book and Playbook exactly
- Put tech stacks in context, not as a skills list
- Write achievements, not task descriptions
- Return ONLY the markdown content, no code fences, no explanation`;

    const userPrompt = `=== PROJECT BOOK ===\n${book.content}\n\n=== APPLICATION PLAYBOOK ===\n${playbook.content}\n\nGenerate the "${label}" resume (Version ${letter}) now.`;

    try {
      let resume: string;

      if (aiMode === 'cli') {
        const result = await callAiCli({
          operation: 'generate_base_resume',
          systemPrompt,
          userPrompt,
          context: { type: 'resume_version' },
        });
        resume = result.text;
      } else {
        const result = await callAiApi({
          operation: 'generate_base_resume',
          model: getModel(),
          maxTokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
          context: { type: 'resume_version' },
        });
        resume = result.text;
      }

      // Strip code fences if the model wraps the output
      resume = resume.trim();
      if (resume.startsWith('```')) {
        resume = resume.replace(/^```(?:markdown|md)?\n?/, '').replace(/\n?```$/, '');
      }

      const filePath = path.join(versionsDir, `resume-${letter.toLowerCase()}.md`);
      try {
        fs.writeFileSync(filePath, resume + '\n');
      } catch (writeErr) {
        const msg = writeErr instanceof Error ? writeErr.message : 'Unknown error';
        return { success: false, generated, error: `Failed to write resume-${letter.toLowerCase()}.md: ${msg}` };
      }
      generated.push(letter);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        success: false,
        generated,
        error: `Failed generating Version ${letter} (${label}): ${message}`,
      };
    }
  }

  return { success: true, generated };
}
