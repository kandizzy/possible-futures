/**
 * Parse JOB_SEARCH_COMPASS.md into structured data for seeding the database.
 */

export interface ParsedRole {
  title: string;
  want: number;
  can: number;
  grow: number;
  pay: number;
  team: number;
  impact: number;
  total: number;
}

export interface ParsedCompany {
  name: string;
  category: string;
  why_interested: string;
}

export interface ParsedPerson {
  name: string;
  description: string;
}

export interface ParsedCompass {
  roles: ParsedRole[];
  companies: ParsedCompany[];
  people: ParsedPerson[];
  signal_words: string[];
  red_flag_words: string[];
  compensation_floor: number;
}

function extractSection(text: string, startHeader: string, endMarkers: string[]): string {
  const startIdx = text.indexOf(startHeader);
  if (startIdx === -1) return '';

  const afterStart = text.substring(startIdx + startHeader.length);

  let endIdx = afterStart.length;
  for (const marker of endMarkers) {
    const idx = afterStart.indexOf(marker);
    if (idx !== -1 && idx < endIdx) {
      endIdx = idx;
    }
  }

  return afterStart.substring(0, endIdx).trim();
}

function parseSignalWords(section: string): string[] {
  const words: string[] = [];
  const lines = section.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('-')) continue;
    // Extract quoted phrases: "phrase" or "phrase" / "phrase"
    const matches = trimmed.match(/"([^"]+)"/g);
    if (matches) {
      for (const match of matches) {
        words.push(match.replace(/"/g, ''));
      }
    }
  }
  return words;
}

function parseScoringTable(section: string): ParsedRole[] {
  const roles: ParsedRole[] = [];
  const lines = section.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.includes('---') || trimmed.toLowerCase().includes('role')) continue;

    const cells = trimmed.split('|').map(c => c.trim()).filter(c => c.length > 0);
    if (cells.length < 8) continue;

    const title = cells[0];
    const scores = cells.slice(1, 7).map(s => {
      const num = parseInt(s.trim(), 10);
      return isNaN(num) || num < 0 || num > 3 ? NaN : num;
    });
    if (scores.some(isNaN)) continue;

    roles.push({
      title,
      want: scores[0],
      can: scores[1],
      grow: scores[2],
      pay: scores[3],
      team: scores[4],
      impact: scores[5],
      total: scores.reduce((a, b) => a + b, 0),
    });
  }

  return roles;
}

function parseCompanies(section: string): ParsedCompany[] {
  const companies: ParsedCompany[] = [];
  let currentCategory = '';

  const lines = section.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();

    const categoryMatch = trimmed.match(/^###\s+(.+)/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1];
      continue;
    }

    if (!trimmed.startsWith('- **')) continue;

    const nameMatch = trimmed.match(/\*\*([^*]+)\*\*/);
    if (!nameMatch) continue;

    const name = nameMatch[1];
    const afterName = trimmed.substring(trimmed.indexOf('**', trimmed.indexOf('**') + 2) + 2).replace(/^\s*[—-]\s*/, '').trim();

    companies.push({
      name,
      category: currentCategory,
      why_interested: afterName,
    });
  }

  return companies;
}

function parsePeople(section: string): ParsedPerson[] {
  const people: ParsedPerson[] = [];

  const lines = section.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('- **')) continue;

    const nameMatch = trimmed.match(/\*\*([^*]+)\*\*/);
    if (!nameMatch) continue;

    const name = nameMatch[1];
    const afterName = trimmed.substring(trimmed.indexOf('**', trimmed.indexOf('**') + 2) + 2).replace(/^\s*[—-]\s*/, '').trim();

    people.push({ name, description: afterName });
  }

  return people;
}

function parseCompensationFloor(text: string): number {
  // Look for "Compensation floor:" followed by a dollar amount
  const match = text.match(/\*\*Compensation floor[:\*]*\*?\s*\$?([\d,]+)/i);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10) || 0;
  }
  return 0;
}

export function parseCompass(text: string): ParsedCompass {
  const signalSection = extractSection(text, '## Signal Words in Job Postings', ['## Red Flag Words']);
  const redFlagSection = extractSection(text, '## Red Flag Words in Job Postings', ['\n---\n', '## Companies']);
  const scoringSection = extractSection(text, '### Scoring the Roles We\'ve Evaluated', ['\n---\n', '## For Automated']);
  const companiesSection = extractSection(text, '## Companies and Teams to Watch', ['\n---\n', '## People']);
  const peopleSection = extractSection(text, '## People Whose Orbits', ['\n---\n', '## How to Score']);

  return {
    roles: parseScoringTable(scoringSection),
    companies: parseCompanies(companiesSection),
    people: parsePeople(peopleSection),
    signal_words: parseSignalWords(signalSection),
    red_flag_words: parseSignalWords(redFlagSection),
    compensation_floor: parseCompensationFloor(text),
  };
}
