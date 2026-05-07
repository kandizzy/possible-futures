/**
 * Date formatting helpers. Default style is US-flavored ("May 3rd, 2026")
 * because the user's primary audience reads that natively. The European
 * variant is "3 May 2026" — same month-by-name format, just day-first and
 * no ordinal.
 *
 * Both styles intentionally avoid numeric-only forms (03/05/2026 vs.
 * 05/03/2026) where US/European ambiguity is hostile to the reader.
 */

export type DateLocale = 'us' | 'european' | 'iso';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

/**
 * Format a date string (or Date) for display. Accepts SQLite-style
 * timestamps ("2026-04-14 20:51:43"), ISO 8601, or already-Date objects.
 * Returns the original string on parse failure (defensive).
 */
export function formatDate(
  input: string | Date | null | undefined,
  locale: DateLocale = 'us',
): string {
  if (!input) return '';
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) {
    return typeof input === 'string' ? input : '';
  }
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  if (locale === 'iso') {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${m}-${dd}`;
  }
  if (locale === 'european') {
    return `${day} ${month} ${year}`;
  }
  return `${month} ${ordinal(day)}, ${year}`;
}
