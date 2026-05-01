import { NextRequest, NextResponse } from 'next/server';
import { markdownToPdf } from '@/lib/pdf';
import { getApplicationByRoleId } from '@/lib/queries/applications';
import { getRoleById } from '@/lib/queries/roles';
import { buildResumeFromBase } from '@/lib/resume-builder';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET(request: NextRequest) {
  const roleId = Number(request.nextUrl.searchParams.get('role'));
  const type = request.nextUrl.searchParams.get('type') || 'all';

  if (!roleId || !Number.isInteger(roleId)) {
    return NextResponse.json({ error: 'Missing or invalid role parameter' }, { status: 400 });
  }

  const role = getRoleById(roleId);
  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  const app = getApplicationByRoleId(roleId);

  const sections: string[] = [];

  if (type === 'cover-letter' || type === 'all') {
    const coverLetter = app?.cover_letter_text;
    if (coverLetter) {
      sections.push(coverLetter);
    }
  }

  if (type === 'resume' || type === 'all') {
    // Prefer the full tailored resume body stored in the DB. For older rows
    // where resume_text was never persisted (rows created before that column
    // existed), rebuild on the fly from the base resume markdown + the saved
    // tailored summary. Last resort: just emit the summary blurb so we never
    // produce an empty PDF.
    let resume = app?.resume_text || null;
    if (!resume && app?.resume_summary_text && app?.resume_version_used) {
      const built = buildResumeFromBase(app.resume_version_used, app.resume_summary_text);
      if (built) resume = built;
    }
    if (!resume) resume = app?.resume_summary_text || null;
    if (resume) {
      if (sections.length > 0) sections.push('\n---\n');
      sections.push(resume);
    }
  }

  if (sections.length === 0) {
    return NextResponse.json({ error: 'No materials found for this role. Generate them first.' }, { status: 404 });
  }

  const markdown = sections.join('\n\n');
  const filename = `${slugify(role.company)}-${slugify(role.title)}${type === 'all' ? '-application' : `-${type}`}.pdf`;

  try {
    const pdf = await markdownToPdf(markdown);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `PDF generation failed: ${msg}` }, { status: 500 });
  }
}
