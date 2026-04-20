export function slugifyName(name: string): string {
  return name
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_-]/g, '');
}

export function extractNameFromBook(content: string | null | undefined): string | null {
  if (!content) return null;
  const match = content.match(/^#\s+(.+?)\s*$/m);
  if (!match) return null;
  const h1 = match[1].trim();
  // Handle: "The Book of Name", "Name — Project Book", "Name: Project Book"
  let cleaned = h1;
  cleaned = cleaned.replace(/^The\s+Book\s+of\s+/i, '');
  while (/[—–:\-]\s*Project\s+Book/i.test(cleaned)) {
    cleaned = cleaned.replace(/\s*[—–:\-]\s*Project\s+Book\s*/i, '').trim();
  }
  cleaned = cleaned.replace(/\s*[—–:\-]\s*Possible\s+Futures\s*$/i, '').trim();
  return cleaned || null;
}

export function deriveBookFilename(
  name: string | null | undefined,
  fallback = 'Project_Book.md',
): string {
  if (!name) return fallback;
  const slug = slugifyName(name);
  if (!slug) return fallback;
  return `${slug}_Possible_Futures.md`;
}
