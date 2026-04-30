import { getModel } from './client';
import { callAiApi, callAiCli, callAiLocal } from './call';
import { extractJson } from './parse-json';
import { getAiMode, getMaterialsMode } from '../queries/compass';
import { getSourceFile, getResumeVersionLabels } from '../queries/source-files';
import { getRecentMaterialsCalibrations } from '../queries/materials-calibrations';
import type { MaterialsResponse, Role, AiMode, MaterialsMode } from '../types';

const FULL_SYSTEM_PROMPT = `You are a resume and cover letter writer for a specific person. You will receive their full career history (Project Book), their application rules (Playbook), and a job posting. Generate a tailored cover letter AND a full two-page resume in markdown.

For the resume:
- Two pages max. Use the role-type emphasis guide from the Playbook to decide what to lead with and what to compress.
- Write achievement-oriented bullets, not task descriptions.
- Put tech stacks in context (e.g., "Built the checkout flow in React with Stripe integration" not "Proficient in React").
- Include: name and contact info, summary, work experience (with bullets), selected projects, education, and skills.
- Reorder and emphasize sections based on what matters for THIS specific role.
- Format as clean markdown with headers, bullet points, and bold text where appropriate.

Return ONLY valid JSON.`;

const SUMMARY_SYSTEM_PROMPT = `You are a resume and cover letter writer for a specific person. You will receive their full career history (Project Book), their application rules (Playbook), and a job posting. Generate a tailored cover letter and resume summary.

Return ONLY valid JSON.`;

function getVersionOptions(): string {
  const labels = getResumeVersionLabels();
  const keys = Object.keys(labels);
  if (keys.length > 0) return keys.map(k => `"${k}"`).join(' | ');
  return '"A" | "B" | "C" | "D"';
}

function getFullJsonSchema(): string {
  return `Return your output as JSON in exactly this format (no markdown, no code fences, just raw JSON):
{
  "cover_letter": "<The full 3-paragraph cover letter text>",
  "resume": "<The full tailored resume in markdown format. Two pages max when printed.>",
  "resume_summary": "<A 3-4 sentence summary that mirrors the target job title>",
  "resume_version": ${getVersionOptions()},
  "version_rationale": "<Why this version>",
  "key_projects_to_emphasize": ["<3-4 projects from the Book that best map to this role>"],
  "projects_to_compress": ["<Projects to keep but minimize for this application>"]
}`;
}

function getJsonSchema(mode: MaterialsMode): string {
  if (mode === 'full') return getFullJsonSchema();
  return `Return your output as JSON in exactly this format (no markdown, no code fences, just raw JSON):
{
  "cover_letter": "<The full 3-paragraph cover letter text>",
  "resume_summary": "<A 3-4 sentence summary that mirrors the target job title>",
  "resume_version": ${getVersionOptions()},
  "version_rationale": "<Why this version>",
  "key_projects_to_emphasize": ["<3-4 projects from the Book that best map to this role>"],
  "projects_to_compress": ["<Projects to keep but minimize for this application>"]
}`;
}

export function extractSection(content: string, header: string): string {
  const idx = content.indexOf(header);
  if (idx === -1) return '';
  const afterHeader = content.substring(idx + header.length);
  // Find the next ## header or end of file
  const nextHeader = afterHeader.search(/\n## /);
  return nextHeader === -1 ? afterHeader.trim() : afterHeader.substring(0, nextHeader).trim();
}

export function extractRules(book: string, playbook: string): string {
  const sections: string[] = [];

  // Extract Writing Rules from Book
  const writingRules = extractSection(book, '## Writing Rules');
  if (writingRules) {
    sections.push('WRITING RULES (from Project Book):');
    sections.push(writingRules);
  }

  // Extract Things to Never Say from Book
  const neverSay = extractSection(book, '## Things to Never Say');
  if (neverSay) {
    sections.push('\nTHINGS TO NEVER SAY (from Project Book):');
    sections.push(neverSay);
  }

  // Extract Resume Rules from Playbook
  const resumeRules = extractSection(playbook, '## Resume Rules');
  if (resumeRules) {
    sections.push('\nRESUME RULES (from Application Playbook):');
    sections.push(resumeRules);
  }

  // Extract Cover Letter Rules from Playbook
  const coverRules = extractSection(playbook, '## Cover Letter Rules');
  if (coverRules) {
    sections.push('\nCOVER LETTER RULES (from Application Playbook):');
    sections.push(coverRules);
  }

  // Extract Things to Never Do from Playbook
  const neverDo = extractSection(playbook, '## Things to Never Do');
  if (neverDo) {
    sections.push('\nTHINGS TO NEVER DO (from Application Playbook):');
    sections.push(neverDo);
  }

  return sections.join('\n');
}

function truncate(text: string, max = 300): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '...';
}

function formatMaterialsCalibrations(): string {
  const calibrations = getRecentMaterialsCalibrations(5);
  if (calibrations.length === 0) return '';

  let result = 'Here are recent edits the user made to AI-generated materials. Study what they changed — it reveals their preferences for tone, structure, and content:\n\n';

  for (const cal of calibrations) {
    result += `Role: '${cal.title}, ${cal.company}' — Field: ${cal.field}\n`;
    result += `AI wrote: "${truncate(cal.ai_text)}"\n`;
    result += `User changed to: "${truncate(cal.edited_text)}"\n`;
    if (cal.reason) {
      result += `Reason: "${cal.reason}"\n`;
    }
    result += '\n';
  }

  result += 'Apply these editing patterns to your output. Match the user\'s voice, not a generic professional tone.';
  return result;
}

function buildMaterialsPrompt(role: Role, materialsMode: MaterialsMode): string {
  const book = getSourceFile('PROJECT_BOOK');
  const playbook = getSourceFile('APPLICATION_PLAYBOOK.md');

  const bookContent = book?.content || '[Project Book not loaded. Run the seed script.]';
  const playbookContent = playbook?.content || '[Playbook not loaded. Run the seed script.]';

  const parts: string[] = [];

  parts.push('=== CAREER HISTORY (PROJECT BOOK) ===');
  parts.push(bookContent);

  parts.push('\n=== APPLICATION PLAYBOOK ===');
  parts.push(playbookContent);

  parts.push('\n=== ROLE DETAILS ===');
  parts.push(`Title: ${role.title}`);
  parts.push(`Company: ${role.company}`);
  if (role.location) parts.push(`Location: ${role.location}`);
  if (role.salary_range) parts.push(`Salary: ${role.salary_range}`);
  parts.push(`AI Recommendation: ${role.ai_recommendation}`);
  parts.push(`Recommended Resume Version: ${role.recommended_resume_version || 'Not set'}`);

  if (role.fit_summary) {
    parts.push('\n=== FIT SUMMARY (from scoring) ===');
    parts.push(role.fit_summary);
  }

  if (role.posting_text) {
    parts.push('\n=== JOB POSTING ===');
    parts.push(role.posting_text);
  }

  // Extract and repeat rules at the end so they're freshest in context
  const rules = extractRules(bookContent, playbookContent);
  if (rules) {
    parts.push('\n=== MANDATORY RULES — FOLLOW ALL OF THESE EXACTLY ===');
    parts.push(rules);
    parts.push('\nBefore returning your response, check every rule above against your output. If ANY rule is violated, fix it. This is not optional.');
  }

  // Include recent materials editing calibrations
  const materialsCalibrationText = formatMaterialsCalibrations();
  if (materialsCalibrationText) {
    parts.push('\n=== MATERIALS EDITING HISTORY ===');
    parts.push(materialsCalibrationText);
  }

  parts.push('\n=== OUTPUT FORMAT ===');
  parts.push(getJsonSchema(materialsMode));

  return parts.join('\n');
}

export function parseMaterialsResponse(raw: string, _materialsMode: MaterialsMode): MaterialsResponse {
  const parsed = extractJson<MaterialsResponse>(raw);

  if (!parsed.cover_letter || !parsed.resume_summary) {
    throw new Error('Response missing required fields (cover_letter or resume_summary)');
  }

  // In summary mode, resume won't be present — set to empty string
  if (!parsed.resume) {
    parsed.resume = '';
  }

  return parsed;
}

export async function generateMaterials(role: Role, modeOverride?: AiMode): Promise<MaterialsResponse> {
  const aiMode = modeOverride || getAiMode();
  const materialsMode = getMaterialsMode();
  const systemPrompt = materialsMode === 'full' ? FULL_SYSTEM_PROMPT : SUMMARY_SYSTEM_PROMPT;
  const userPrompt = buildMaterialsPrompt(role, materialsMode);
  const context = { type: 'role' as const, id: role.id };

  let rawResponse: string;

  if (aiMode === 'cli') {
    const result = await callAiCli({
      operation: 'generate_materials',
      systemPrompt,
      userPrompt,
      context,
    });
    rawResponse = result.text;
  } else if (aiMode === 'local') {
    const result = await callAiLocal({
      operation: 'generate_materials',
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: materialsMode === 'full' ? 8192 : 4096,
      context,
    });
    rawResponse = result.text;
  } else {
    const result = await callAiApi({
      operation: 'generate_materials',
      model: getModel(),
      maxTokens: materialsMode === 'full' ? 8192 : 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      context,
    });
    rawResponse = result.text;
  }

  return parseMaterialsResponse(rawResponse, materialsMode);
}
