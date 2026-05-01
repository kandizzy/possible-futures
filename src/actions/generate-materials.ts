'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { getRoleById } from '@/lib/queries/roles';
import { generateMaterials } from '@/lib/ai/materials';
import { getResumeVersionLabels } from '@/lib/queries/source-files';
import { upsertApplicationForRole, updateApplicationMaterials, getApplicationByRoleId } from '@/lib/queries/applications';
import { insertMaterialsCalibration } from '@/lib/queries/materials-calibrations';
import type { MaterialsResponse } from '@/lib/types';
import { buildResumeFromBase } from '@/lib/resume-builder';

export interface MaterialsResult {
  success: boolean;
  materials?: MaterialsResponse;
  path?: string;
  error?: string;
}

export interface BaseResumeStatus {
  missing: string[];
  found: string[];
  versions: Record<string, string>;
}

export async function checkBaseResumes(): Promise<BaseResumeStatus> {
  const versions = getResumeVersionLabels();
  const missing: string[] = [];
  const found: string[] = [];

  for (const letter of Object.keys(versions)) {
    const filePath = path.join(process.cwd(), '..', 'versions', `resume-${letter.toLowerCase()}.md`);
    if (fs.existsSync(filePath)) {
      found.push(letter);
    } else {
      missing.push(letter);
    }
  }

  return { missing, found, versions };
}

export async function getSavedMaterials(roleId: number): Promise<{
  cover_letter: string;
  resume_summary: string;
  resume: string;
  resume_version: string;
  folder_path: string;
  cover_letter_ai_draft: string;
  current_status: string;
  date_applied: string | null;
} | null> {
  const app = getApplicationByRoleId(roleId);
  if (!app || !app.cover_letter_generated) return null;
  if (!app.cover_letter_text && !app.resume_summary_text) return null;
  return {
    cover_letter: app.cover_letter_text || '',
    resume_summary: app.resume_summary_text || '',
    resume: app.resume_text || '',
    resume_version: app.resume_version_used || '',
    folder_path: app.version_folder_path || '',
    cover_letter_ai_draft: app.cover_letter_ai_draft || '',
    current_status: app.current_status,
    date_applied: app.date_applied,
  };
}

export async function generateMaterialsAction(roleId: number): Promise<MaterialsResult> {
  const role = getRoleById(roleId);
  if (!role) {
    return { success: false, error: 'Role not found.' };
  }

  try {
    const materials = await generateMaterials(role);

    // In summary mode, combine the AI summary with the base resume for this version
    if (!materials.resume && materials.resume_version) {
      materials.resume = buildResumeFromBase(materials.resume_version, materials.resume_summary);
    }

    // Auto-save to ../versions/{company-role}/
    const { path: savedPath } = await exportMaterials(
      roleId,
      materials.cover_letter,
      materials.resume,
      materials.resume_summary,
      materials.resume_version
    );

    // Persist to database so materials survive navigation
    const appId = upsertApplicationForRole(roleId);
    updateApplicationMaterials(appId, {
      cover_letter_text: materials.cover_letter,
      resume_summary_text: materials.resume_summary,
      resume_text: materials.resume,
      resume_version_used: materials.resume_version,
      version_folder_path: savedPath,
      cover_letter_ai_draft: materials.cover_letter,
    });

    revalidatePath(`/roles/${roleId}/materials`);
    return { success: true, materials, path: savedPath };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `Materials generation failed: ${message}` };
  }
}

export async function exportMaterials(
  roleId: number,
  coverLetter: string,
  resume: string,
  resumeSummary: string,
  resumeVersion: string,
  aiDrafts?: { coverLetter?: string; resumeSummary?: string },
  editReason?: string,
): Promise<{ success: boolean; path?: string; error?: string }> {
  const role = getRoleById(roleId);
  if (!role) {
    return { success: false, error: 'Role not found.' };
  }

  // Create version folder name from company and role
  const folderName = `${role.company}-${role.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const versionsDir = path.join(process.cwd(), '..', 'versions', folderName);

  try {
    if (!fs.existsSync(versionsDir)) {
      fs.mkdirSync(versionsDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(versionsDir, 'cover_letter.md'),
      `# Cover Letter — ${role.title} at ${role.company}\n\nResume Version: ${resumeVersion}\n\n${coverLetter}\n`
    );

    if (resume) {
      fs.writeFileSync(
        path.join(versionsDir, 'resume.md'),
        `${resume}\n`
      );
    }

    fs.writeFileSync(
      path.join(versionsDir, 'resume_summary.md'),
      `# Resume Summary — ${role.title} at ${role.company}\n\nVersion: ${resumeVersion}\n\n${resumeSummary}\n`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `Failed to save materials: ${message}` };
  }

  // Update database with edited content
  const appId = upsertApplicationForRole(roleId);
  updateApplicationMaterials(appId, {
    cover_letter_text: coverLetter,
    resume_summary_text: resumeSummary,
    resume_text: resume,
    resume_version_used: resumeVersion,
    version_folder_path: versionsDir,
  });

  // Create materials calibrations if the user edited the AI drafts
  if (aiDrafts?.coverLetter && coverLetter.trim() !== aiDrafts.coverLetter.trim()) {
    insertMaterialsCalibration({
      role_id: roleId,
      field: 'cover_letter',
      ai_text: aiDrafts.coverLetter,
      edited_text: coverLetter,
      reason: editReason || undefined,
    });
  }
  if (aiDrafts?.resumeSummary && resumeSummary.trim() !== aiDrafts.resumeSummary.trim()) {
    insertMaterialsCalibration({
      role_id: roleId,
      field: 'resume_summary',
      ai_text: aiDrafts.resumeSummary,
      edited_text: resumeSummary,
      reason: editReason || undefined,
    });
  }

  revalidatePath(`/roles/${roleId}/materials`);
  return { success: true, path: versionsDir };
}
