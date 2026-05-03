/**
 * Trim the compiled Book markdown down to a subset of roles, leaving
 * everything outside the Career Timeline section intact.
 *
 * Used by CLI/local scoring to keep the prompt under the model's effective
 * working size — Career Timeline is by far the biggest section in a
 * substantial career book, but throughline, projects, and recognition stay
 * relatively flat.
 */

export interface RoleEntry {
  /** Zero-based index in compile order, matching the order roles appear in the Book. */
  index: number;
  /** "Title · Company" extracted from the `### ` heading. */
  heading: string;
  /** "Start – End" or "Start – Present" — the italic line under the heading. */
  dates: string;
}

const TIMELINE_HEADING = '## Career Timeline';

/**
 * Parse the Book markdown to enumerate roles in the Career Timeline.
 * Returns one entry per `### Title · Company` heading found in the section,
 * with its accompanying `_dates_` italic line.
 */
export function extractRoleList(book: string): RoleEntry[] {
  const start = book.indexOf(TIMELINE_HEADING);
  if (start === -1) return [];
  const afterHeader = start + TIMELINE_HEADING.length;
  const nextH2 = book.indexOf('\n## ', afterHeader);
  const end = nextH2 === -1 ? book.length : nextH2;
  const body = book.slice(afterHeader, end);

  // `### Title · Company` followed by `_dates_` — captured per role.
  const re = /^### (.+)\n_([^_\n]+)_/gm;
  const entries: RoleEntry[] = [];
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(body)) !== null) {
    entries.push({ index: i, heading: m[1].trim(), dates: m[2].trim() });
    i++;
  }
  return entries;
}

/**
 * Return a Book with only the selected roles in the Career Timeline section.
 * Everything outside Career Timeline (throughline, current situation,
 * projects, recognition, etc.) is preserved verbatim.
 *
 * If selectedIndices is empty or the Book has no Career Timeline section,
 * the original Book is returned unchanged.
 */
export function buildSlimBook(book: string, selectedIndices: number[]): string {
  const start = book.indexOf(TIMELINE_HEADING);
  if (start === -1) return book;
  const afterHeader = start + TIMELINE_HEADING.length;
  const nextH2 = book.indexOf('\n## ', afterHeader);
  const end = nextH2 === -1 ? book.length : nextH2;
  const body = book.slice(afterHeader, end);

  // Split body into [preamble, roleA, roleB, ...] where each role starts
  // with `### `. The first split element is whatever sits before the first
  // role heading (typically just whitespace).
  const parts = body.split(/\n(?=### )/);
  const preamble = parts[0];
  const roles = parts.slice(1);

  if (roles.length === 0) return book;

  const selected = new Set(selectedIndices);
  const kept = roles.filter((_, i) => selected.has(i));

  // Re-assemble. If nothing was selected, leave a marker note instead of
  // an empty timeline — preserves the section header so structure is intact.
  const newBody =
    kept.length === 0
      ? preamble + '\n_(roles trimmed for relevance — see selector pre-pass)_\n'
      : preamble + kept.map((r) => '\n' + r).join('');

  return book.slice(0, afterHeader) + newBody + book.slice(end);
}
