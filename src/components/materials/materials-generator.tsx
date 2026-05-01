'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  generateMaterialsAction,
  exportMaterials,
  checkBaseResumes,
  getSavedMaterials,
} from '@/actions/generate-materials';
import { generateBaseResumesAction } from '@/actions/settings';
import { Section, LoadingPanel } from '@/components/layout/editorial';
import { MarkdownEditor } from '@/components/layout/markdown-editor';
import { MarkSubmittedButton } from '@/components/roles/mark-submitted-button';
import type { MaterialsResponse, MaterialsMode } from '@/lib/types';
import Link from 'next/link';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function MaterialsGenerator({
  roleId,
  roleTitle,
  company,
  versionLabels,
  materialsMode,
}: {
  roleId: number;
  roleTitle: string;
  company: string;
  versionLabels: Record<string, string>;
  materialsMode: MaterialsMode;
}) {
  const [isPending, startTransition] = useTransition();
  const [materials, setMaterials] = useState<MaterialsResponse | null>(null);
  const [error, setError] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState('');
  const [resumeSummary, setResumeSummary] = useState('');
  const [savedPath, setSavedPath] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [missingResumes, setMissingResumes] = useState<string[]>([]);
  const [generatingResumes, setGeneratingResumes] = useState(false);
  const [resumeGenStatus, setResumeGenStatus] = useState('');

  const [aiDraftCoverLetter, setAiDraftCoverLetter] = useState('');
  const [aiDraftSummary, setAiDraftSummary] = useState('');
  const [editReason, setEditReason] = useState('');
  const [appStatus, setAppStatus] = useState<string>('Draft');
  const [appDateApplied, setAppDateApplied] = useState<string | null>(null);

  useEffect(() => {
    if (materialsMode === 'summary') {
      checkBaseResumes().then((status) => {
        setMissingResumes(status.missing);
      });
    }
    getSavedMaterials(roleId).then((saved) => {
      if (saved) {
        setMaterials({
          cover_letter: saved.cover_letter,
          resume: saved.resume,
          resume_summary: saved.resume_summary,
          resume_version: saved.resume_version as MaterialsResponse['resume_version'],
          version_rationale: '',
          key_projects_to_emphasize: [],
          projects_to_compress: [],
        });
        setCoverLetter(saved.cover_letter);
        setResume(saved.resume);
        setResumeSummary(saved.resume_summary);
        setSavedPath(saved.folder_path);
        setAppStatus(saved.current_status);
        setAppDateApplied(saved.date_applied);
        if (saved.cover_letter_ai_draft) {
          setAiDraftCoverLetter(saved.cover_letter_ai_draft);
        }
      }
    });
  }, [materialsMode, roleId]);

  const hasEdits =
    (aiDraftCoverLetter && coverLetter.trim() !== aiDraftCoverLetter.trim()) ||
    (aiDraftSummary && resumeSummary.trim() !== aiDraftSummary.trim());

  // Stale-materials check: materials were saved to a folder named after the
  // company + title at generation time. If either has been edited since,
  // the saved folder name no longer matches and the cover letter / summary
  // may reference the old name.
  const expectedFolderSlug = slugify(`${company}-${roleTitle}`);
  const savedFolderSlug = savedPath ? savedPath.replace(/\/+$/, '').split('/').pop() ?? '' : '';
  const isStale = Boolean(materials && savedPath && savedFolderSlug && savedFolderSlug !== expectedFolderSlug);

  function handleGenerateBaseResumes() {
    setGeneratingResumes(true);
    setResumeGenStatus('');
    startTransition(async () => {
      const res = await generateBaseResumesAction(missingResumes);
      setGeneratingResumes(false);
      if (res.success) {
        setMissingResumes([]);
        setResumeGenStatus(
          `Generated ${res.generated.length} base resume${res.generated.length === 1 ? '' : 's'}.`,
        );
      } else {
        if (res.generated.length > 0) {
          setMissingResumes((prev) => prev.filter((l) => !res.generated.includes(l)));
        }
        setResumeGenStatus(res.error || 'Generation failed.');
      }
    });
  }

  function handleGenerate() {
    setError('');
    setSaveStatus('');
    setEditReason('');
    startTransition(async () => {
      const res = await generateMaterialsAction(roleId);
      if (res.success && res.materials) {
        setMaterials(res.materials);
        setCoverLetter(res.materials.cover_letter);
        setResume(res.materials.resume);
        setResumeSummary(res.materials.resume_summary);
        setSavedPath(res.path || '');
        setSaveStatus('');
        setAiDraftCoverLetter(res.materials.cover_letter);
        setAiDraftSummary(res.materials.resume_summary);
      } else {
        setError(res.error || 'Unknown error');
      }
    });
  }

  function handleSave() {
    if (!materials) return;
    setSaveStatus('Saving…');
    startTransition(async () => {
      const res = await exportMaterials(
        roleId,
        coverLetter,
        resume,
        resumeSummary,
        materials.resume_version,
        { coverLetter: aiDraftCoverLetter, resumeSummary: aiDraftSummary },
        editReason,
      );
      if (res.success) {
        setSaveStatus(hasEdits ? 'Saved (edits recorded for future drafts)' : 'Saved');
        setEditReason('');
      } else {
        setSaveStatus(`Save failed: ${res.error}`);
      }
    });
  }

  return (
    <div className="space-y-12">
      {!materials && (
        <div>
          {!isPending && (
            <button onClick={handleGenerate} className="btn-stamp">
              Generate materials
            </button>
          )}
          {isPending && !generatingResumes && (
            <LoadingPanel
              message={
                materialsMode === 'summary'
                  ? 'Writing your cover letter and summary'
                  : 'Writing your cover letter, resume, and summary'
              }
              caption={
                materialsMode === 'summary'
                  ? '15–30 seconds via Anthropic API · several minutes via local model'
                  : '30–60 seconds via Anthropic API · several minutes via local model'
              }
            />
          )}
          {!isPending && error && (
            <div className="mt-6 p-5 border border-stamp bg-stamp/5">
              <div className="smallcaps text-[9px] text-stamp mb-2">Error</div>
              <p className="font-serif italic text-[14px] text-ink whitespace-pre-line">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Missing base resumes note (summary mode only) */}
      {materialsMode === 'summary' && missingResumes.length > 0 && !materials && (
        <div className="p-5 border border-rule bg-paper-2/40">
          <div className="smallcaps text-[9px] text-ink-3 mb-2">Note</div>
          <p
            className="font-serif italic text-[13px] text-ink-2 leading-snug"
            style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
          >
            Base resume files not found for{' '}
            {missingResumes.map((l) => versionLabels[l] || l).join(', ')}. Cover letter
            and summary will generate fine. To also save a tailored resume file,
            generate the base versions below.
          </p>
          <div className="flex items-baseline gap-4 mt-4">
            <button
              onClick={handleGenerateBaseResumes}
              disabled={isPending || generatingResumes}
              className="btn-ghost"
            >
              {generatingResumes
                ? 'Generating'
                : `Generate base resume${missingResumes.length === 1 ? '' : 's'}`}
            </button>
            <Link href="/settings" className="btn-link">
              or switch to full mode
            </Link>
          </div>
          {generatingResumes && (
            <div className="mt-4">
              <LoadingPanel
                message={`Drafting ${missingResumes.length} base resume${missingResumes.length === 1 ? '' : 's'}`}
                caption="30–60 seconds each via Anthropic API · several minutes each via local model"
              />
            </div>
          )}
          {resumeGenStatus && (
            <p
              className={`mt-2 font-serif italic text-[12px] ${
                resumeGenStatus.toLowerCase().includes('fail') ? 'text-stamp' : 'text-ink-2'
              }`}
              style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
            >
              {resumeGenStatus}
            </p>
          )}
        </div>
      )}

      {materials && (
        <>
          {/* Stale materials notice — company or title changed since save */}
          {isStale && !isPending && (
            <div className="p-5 border border-stamp bg-stamp/5">
              <div className="smallcaps text-[9px] text-stamp mb-2">Heads up</div>
              <p
                className="font-serif italic text-[14px] text-ink leading-snug"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
              >
                The role&apos;s company or title has changed since these materials
                were generated. The cover letter and summary may still reference the
                old name. Regenerating will rewrite them and create a new folder
                named for the current values.
              </p>
              <div className="mt-4">
                <button onClick={handleGenerate} className="btn-stamp">
                  Regenerate materials
                </button>
              </div>
            </div>
          )}

          {/* Version + rationale */}
          <Section label="Version">
            <div
              className="font-serif italic text-[20px] text-ink"
              style={{ fontVariationSettings: '"opsz" 20, "SOFT" 60' }}
            >
              {versionLabels[materials.resume_version] || materials.resume_version}
            </div>
            {materials.version_rationale && (
              <p
                className="mt-2 font-serif italic text-[13px] text-ink-2 leading-snug max-w-xl"
                style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
              >
                {materials.version_rationale}
              </p>
            )}
          </Section>

          {/* Cover letter */}
          <Section label="Cover letter">
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={16}
              className="field w-full font-serif text-[15px] leading-[1.65] resize-y"
              style={{ fontVariationSettings: '"opsz" 15, "SOFT" 30' }}
            />
          </Section>

          {/* Resume — markdown with live preview */}
          {resume && (
            <Section label="Resume">
              <MarkdownEditor
                value={resume}
                onChange={setResume}
                rows={28}
                ariaLabel="Tailored resume"
              />
            </Section>
          )}

          {/* Resume summary */}
          <Section label="Summary">
            <textarea
              value={resumeSummary}
              onChange={(e) => setResumeSummary(e.target.value)}
              rows={4}
              className="field w-full font-serif text-[15px] leading-[1.65] resize-y"
              style={{ fontVariationSettings: '"opsz" 15, "SOFT" 30' }}
            />
          </Section>

          {/* Projects */}
          {(materials.key_projects_to_emphasize.length > 0 ||
            materials.projects_to_compress.length > 0) && (
            <div className="grid grid-cols-2 gap-10">
              {materials.key_projects_to_emphasize.length > 0 && (
                <Section label="Emphasize">
                  <ul className="space-y-2">
                    {materials.key_projects_to_emphasize.map((p) => (
                      <li
                        key={p}
                        className="font-serif italic text-[14px] text-ink leading-snug"
                        style={{ fontVariationSettings: '"opsz" 14, "SOFT" 50' }}
                      >
                        “{p}”
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {materials.projects_to_compress.length > 0 && (
                <Section label="Compress">
                  <ul className="space-y-2">
                    {materials.projects_to_compress.map((p) => (
                      <li
                        key={p}
                        className="font-serif italic text-[14px] text-ink-3 leading-snug"
                        style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          )}

          {/* Saved path */}
          {savedPath && (
            <div className="p-4 border border-rule-soft">
              <div className="smallcaps text-[9px] text-ink-3 mb-1">Saved to</div>
              <p className="font-mono text-[11px] text-ink-2">{savedPath}</p>
            </div>
          )}

          {/* Edit reason */}
          {hasEdits && (
            <div className="p-5 border border-rule bg-paper-2/40">
              <label className="smallcaps text-[9px] text-ink-3 block mb-2">
                What did you change? <span className="italic font-serif text-ink-3">(optional)</span>
              </label>
              <input
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="e.g. rewrote opening to lead with a specific project"
                className="field w-full"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-baseline gap-4 pt-6 border-t border-rule">
            <button onClick={handleSave} disabled={isPending} className="btn-stamp">
              Save changes
            </button>
            <button onClick={handleGenerate} disabled={isPending} className="btn-ghost">
              Regenerate
            </button>
            <a
              href={`/api/pdf?role=${roleId}&type=cover-letter`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-ink-2 hover:text-stamp transition-colors cursor-pointer underline decoration-rule hover:decoration-stamp"
            >
              Cover letter PDF
            </a>
            <a
              href={`/api/pdf?role=${roleId}&type=resume`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-ink-2 hover:text-stamp transition-colors cursor-pointer underline decoration-rule hover:decoration-stamp"
            >
              Resume PDF
            </a>
            {saveStatus && (
              <span
                className={`font-serif italic text-[13px] ${
                  saveStatus.toLowerCase().includes('failed') ? 'text-stamp' : 'text-ink-2'
                }`}
                style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
              >
                {saveStatus}
              </span>
            )}
          </div>

          {/* Mark as submitted — surfaces the application-status flip right
              where the user finishes the materials, instead of forcing them
              back to the role detail page. */}
          <div className="pt-6 border-t border-rule-soft">
            <div className="smallcaps text-[9px] text-ink-3 mb-3">After you send it</div>
            <MarkSubmittedButton
              roleId={roleId}
              isSubmitted={appStatus === 'Submitted'}
              dateApplied={appDateApplied}
            />
          </div>
        </>
      )}
    </div>
  );
}
