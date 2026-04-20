import fs from 'fs';
import path from 'path';

/**
 * In summary mode, read the base resume for the recommended version (A-D)
 * and replace its Summary section with the AI-generated summary.
 */
export function buildResumeFromBase(version: string, summary: string): string {
  const baseResumePath = path.join(
    process.cwd(), '..', 'versions',
    `resume-${version.toLowerCase()}.md`
  );

  if (!fs.existsSync(baseResumePath)) {
    return '';
  }

  const base = fs.readFileSync(baseResumePath, 'utf-8') as string;

  // Replace the Summary section content with the AI-generated summary
  // Matches "## Summary" followed by content up to the next "## " header
  const summaryPattern = /(## Summary\n+)([\s\S]*?)(\n## )/;
  if (summaryPattern.test(base)) {
    return base.replace(summaryPattern, `$1${summary}\n\n$3`);
  }

  // If no Summary section found, prepend summary after the first header block
  const firstHeaderEnd = base.indexOf('\n## ');
  if (firstHeaderEnd !== -1) {
    return base.slice(0, firstHeaderEnd) + '\n\n## Summary\n\n' + summary + base.slice(firstHeaderEnd);
  }

  return '## Summary\n\n' + summary + '\n\n' + base;
}
