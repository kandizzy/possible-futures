import type { IntakeAnswers, IntakeEducation, IntakeRole, IntakeProject, IntakeVersion } from '../types';

/**
 * Extract a section block between a header and the next ## header.
 * Tries multiple header patterns to handle both hand-written and compiled Books.
 */
function extractSection(content: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (!match || match.index === undefined) continue;
    const start = match.index + match[0].length;
    const rest = content.substring(start);
    const end = rest.search(/\n## /);
    return (end === -1 ? rest : rest.substring(0, end)).trim();
  }
  return '';
}

/**
 * Split a section into blocks at ### boundaries.
 * Returns array of { header, body } where header is the ### line text.
 */
function splitAtH3(block: string): { header: string; body: string }[] {
  const parts: { header: string; body: string }[] = [];
  const regex = /^### (.+)$/gm;
  let match: RegExpExecArray | null;
  const starts: { header: string; index: number }[] = [];

  while ((match = regex.exec(block)) !== null) {
    starts.push({ header: match[1].trim(), index: match.index + match[0].length });
  }

  for (let i = 0; i < starts.length; i++) {
    const end = i + 1 < starts.length
      ? block.lastIndexOf('\n###', starts[i + 1].index - 1)
      : block.length;
    parts.push({
      header: starts[i].header,
      body: block.substring(starts[i].index, end).trim(),
    });
  }
  return parts;
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export function parseContactFromBook(content: string): Partial<IntakeAnswers> {
  const answers: Partial<IntakeAnswers> = {};

  // Name from H1: "# The Book of Name", "# Name — Project Book", "# Name: Project Book"
  const nameMatch = content.match(/^# (.+?)$/m);
  if (nameMatch) {
    let name = nameMatch[1].trim();
    name = name.replace(/^The\s+Book\s+of\s+/i, '');
    while (/[—–:\-]\s*Project\s+Book/i.test(name)) {
      name = name.replace(/\s*[—–:\-]\s*Project\s+Book\s*/i, '').trim();
    }
    // Also handle "Name: Possible Futures"
    name = name.replace(/\s*[—–:\-]\s*Possible\s+Futures\s*$/i, '').trim();
    if (name) answers.name = name;
  }

  const field = (label: string) => {
    const re = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`);
    return content.match(re)?.[1]?.trim();
  };

  const email = field('Email');
  if (email) answers.email = email;
  const location = field('Location');
  if (location) answers.location = location;
  const website = field('Website');
  if (website) answers.website = website;

  return answers;
}

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

export function parseEducationFromBook(content: string): IntakeEducation[] {
  // Multi-line: **Education:**\n  - Degree, School, Year
  const multiMatch = content.match(/\*\*Education:\*\*\n((?:\s+- .+\n?)+)/);
  if (multiMatch) {
    return (multiMatch[1].match(/- (.+)/g) || []).map((line) => parseEduEntry(line.replace(/^- /, '')));
  }

  // Single-line: **Education:** Entry1; Entry2; ...
  const inlineMatch = content.match(/\*\*Education:\*\*\s*([^\n]+)/);
  if (inlineMatch) {
    return inlineMatch[1].split(';').map((s) => s.trim()).filter(Boolean).map(parseEduEntry);
  }

  return [];
}

function parseEduEntry(raw: string): IntakeEducation {
  const clean = raw.trim();
  // Strip trailing parenthetical details but keep for context
  const withoutParens = clean.replace(/\s*\(.*\)$/, '');

  // Try year at end: "..., 2023"
  const yearMatch = withoutParens.match(/,\s*(\d{4})$/);
  const year = yearMatch ? yearMatch[1] : '';
  const noYear = yearMatch ? withoutParens.slice(0, yearMatch.index) : withoutParens;

  // Split degree from school at last comma
  const lastComma = noYear.lastIndexOf(',');
  if (lastComma > 0) {
    return {
      degree: noYear.substring(0, lastComma).trim(),
      school: noYear.substring(lastComma + 1).trim(),
      year,
    };
  }

  // Can't split — whole thing is the degree
  return { degree: clean, school: '', year };
}

// ---------------------------------------------------------------------------
// Through-line / Positioning
// ---------------------------------------------------------------------------

export function parseThroughLine(content: string): string | undefined {
  const block = extractSection(content, [
    /^## Positioning Statement$/m,
    /^## Positioning$/m,
  ]);
  if (!block) return undefined;

  const cleaned = block
    .replace(/^_[^_]+_\s*\n*/gm, '')       // italic description lines
    .replace(/^\*\*\[CK[^\]]*\].*$/gm, '') // editorial notes
    .replace(/^---\s*$/gm, '')             // horizontal rules
    .trim();

  return cleaned || undefined;
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export function parseRolesFromBook(content: string): IntakeRole[] {
  const timelineBlock = extractSection(content, [
    /^## Career Timeline$/m,
    /^## Career History$/m,
  ]);
  if (!timelineBlock) return [];

  const h3Blocks = splitAtH3(timelineBlock);
  const roles: IntakeRole[] = [];

  for (const { header, body } of h3Blocks) {
    // Match "Title | Company" or "Title · Company"
    const roleMatch = header.match(/^(.+?)\s*[|·]\s*(.+)$/);

    if (roleMatch) {
      const [, title, company] = roleMatch;
      const role = parseRoleBody(title.trim(), company.trim(), body);
      roles.push(role);
    } else if (/previous experience/i.test(header)) {
      // Special case: compressed previous roles
      roles.push({
        id: crypto.randomUUID(),
        title: 'Previous Experience',
        company: '(multiple employers)',
        start: '',
        end: '',
        summary: '',
        proudest: '',
        raw_notes: body.replace(/^\n+/, '').trim(),
      });
    }
  }

  return roles;
}

function parseRoleBody(title: string, company: string, body: string): IntakeRole {
  const lines = body.split('\n');

  // Dates: **Sept 2023 - Present** or _Sept 2023 – Present_
  let start = '';
  let end = '';
  for (const line of lines) {
    const dateMatch = line.match(/(?:\*\*|_)(.+?)(?:\*\*|_)/);
    if (dateMatch && /\d{4}/.test(dateMatch[1])) {
      const parts = dateMatch[1].split(/\s*[-–—]\s*/);
      start = parts[0]?.trim() || '';
      end = parts[1]?.trim() || '';
      break;
    }
  }

  // Summary: first bullet line after the date
  let summary = '';
  let pastDate = false;
  for (const line of lines) {
    if (/\*\*.*\d{4}/.test(line) || /_.*\d{4}/.test(line)) {
      pastDate = true;
      continue;
    }
    if (pastDate && line.trim().startsWith('- ') && !line.includes('[CK')) {
      summary = line.trim().replace(/^- /, '');
      break;
    }
  }

  // Stack: look for explicit labels
  let stack: string | undefined;
  for (const line of lines) {
    const stackMatch = line.match(/\*\*(?:Tech|Stack|Technologies|Tech stack):\*\*\s*(.+)/i);
    if (stackMatch) {
      stack = stackMatch[1].trim();
      break;
    }
  }

  // raw_notes: everything in the body preserves all detail
  const raw_notes = body
    .replace(/^\s*\*\*[^*]*\d{4}[^*]*\*\*\s*$/m, '') // strip date line
    .trim();

  return {
    id: crypto.randomUUID(),
    title,
    company,
    start,
    end,
    summary,
    proudest: '',
    stack,
    raw_notes: raw_notes || undefined,
  };
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function parseProjectsFromBook(content: string): IntakeProject[] {
  const block = extractSection(content, [
    /^## Independent Projects$/m,
    /^## Projects$/m,
  ]);
  if (!block) return [];

  const h3Blocks = splitAtH3(block);
  const projects: IntakeProject[] = [];

  for (const { header, body } of h3Blocks) {
    // Check if this is a consulting umbrella with sub-projects
    if (/consulting projects/i.test(header)) {
      const subProjects = parseConsultingSubProjects(body);
      projects.push(...subProjects);
      continue;
    }

    // Strip year from title: "Project Name (2026)" → "Project Name"
    const title = header.replace(/\s*\([\d\s–—-]+\)\s*$/, '').trim();

    // Description: first non-empty paragraph (not a bullet, not italic description)
    const descLines = body.split('\n');
    let description = '';
    for (const line of descLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('_') || trimmed.startsWith('**[')) continue;
      if (trimmed.startsWith('- ')) {
        description = trimmed.replace(/^- /, '');
        break;
      }
      description = trimmed;
      break;
    }

    // Stack from **Tech:** line
    let stack: string | undefined;
    const techMatch = body.match(/\*\*Tech:\*\*\s*(.+)/);
    if (techMatch) stack = techMatch[1].trim();

    projects.push({
      id: crypto.randomUUID(),
      title,
      description,
      stack,
    });
  }

  return projects;
}

function parseConsultingSubProjects(body: string): IntakeProject[] {
  const projects: IntakeProject[] = [];
  const subRegex = /\*\*([^*]+)\*\*\n([\s\S]*?)(?=\n\*\*[^*]+\*\*\n|$)/g;
  let match;

  while ((match = subRegex.exec(body)) !== null) {
    const title = match[1].trim();
    const subBody = match[2].trim();

    // First bullet as description
    const firstBullet = subBody.match(/^- (.+)$/m);
    const description = firstBullet ? firstBullet[1] : '';

    // Stack
    const techMatch = subBody.match(/\*\*Tech:\*\*\s*(.+)/);
    const stack = techMatch ? techMatch[1].trim() : undefined;

    projects.push({
      id: crypto.randomUUID(),
      title,
      description,
      stack,
    });
  }

  return projects;
}

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

export function parseVersionsFromBook(content: string): IntakeVersion[] {
  const block = extractSection(content, [
    /^## Two-Version Strategy$/m,
    /^## Version Strategy$/m,
    /^## Role-Type Emphasis Guide$/m,
  ]);
  if (!block) return [];

  const versions: IntakeVersion[] = [];

  // Format A (hand-written): ### Version A: The Leader
  const h3Blocks = splitAtH3(block);
  for (const { header, body } of h3Blocks) {
    const vMatch = header.match(/^Version ([A-Z]):\s*(.+)$/);
    if (!vMatch) continue;

    const letter = vMatch[1];
    const label = vMatch[2].replace(/\s*\(.*\)$/, '').trim();

    // Emphasis: body content, stripping _For:_ lines and editorial notes
    const emphasis = body
      .replace(/^_For:.*_?\s*$/gm, '')
      .replace(/^\*\*\[CK[^\]]*\].*$/gm, '')
      .replace(/^---\s*$/gm, '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n');

    versions.push({ letter, label, emphasis });
  }

  if (versions.length > 0) return versions;

  // Format B (compiled): ### Version A: Label\n\nemphasis text
  // Already handled by the h3 parser above

  // Format C (inline): - **Version A — Label:** emphasis
  const inlineRegex = /\*\*Version ([A-Z])\s*[—–-]\s*(.+?):\*\*\s*(.+)/g;
  let match;
  while ((match = inlineRegex.exec(block)) !== null) {
    versions.push({
      letter: match[1],
      label: match[2].trim(),
      emphasis: match[3].trim(),
    });
  }

  return versions;
}

// ---------------------------------------------------------------------------
// Sensitive Context
// ---------------------------------------------------------------------------

export function parseSensitiveContext(content: string): string | undefined {
  const block = extractSection(content, [/^## Sensitive Context$/m]);
  if (!block) return undefined;

  const cleaned = block
    .replace(/^_[^_]+_\s*\n*/gm, '')
    .replace(/^\*\*\[CK FILL IN[^\]]*\]\*\*.*$/gm, '')
    .trim();

  return (cleaned && !cleaned.startsWith('_(none)')) ? cleaned : undefined;
}

// ---------------------------------------------------------------------------
// Recognition
// ---------------------------------------------------------------------------

export function parseRecognition(content: string): string[] {
  const block = extractSection(content, [
    /^## Recognition & Exhibitions$/m,
    /^## Recognition$/m,
  ]);
  if (!block) return [];

  const items: string[] = [];
  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') && !trimmed.startsWith('- _') && !trimmed.startsWith('- **[')) {
      items.push(trimmed.replace(/^- /, ''));
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// AI Scoring Context (dream role, current situation from structured fields)
// ---------------------------------------------------------------------------

export function parseScoringContext(content: string): Partial<IntakeAnswers> {
  const answers: Partial<IntakeAnswers> = {};

  const dreamMatch = content.match(/\*\*Dream role:\*\*\s*(.+)/);
  if (dreamMatch) answers.dream_role = dreamMatch[1].trim();

  const sitMatch = content.match(/\*\*Current situation:\*\*\s*(.+)/);
  if (sitMatch) answers.current_situation = sitMatch[1].trim();

  return answers;
}
