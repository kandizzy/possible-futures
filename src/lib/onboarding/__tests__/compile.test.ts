import { describe, it, expect } from 'vitest';
import { compileIntake } from '../compile';
import { parseCompass } from '@/lib/parsers/compass';
import { extractSection, extractRules } from '@/lib/ai/materials';
import type { IntakeAnswers } from '@/lib/types';

function sampleAnswers(overrides: Partial<IntakeAnswers> = {}): IntakeAnswers {
  return {
    name: 'Jane Chen',
    email: 'jane@example.com',
    location: 'Brooklyn, NY',
    website: 'janechen.design',
    education: [{ degree: 'MFA, Interaction Design', school: 'SVA', year: '2024' }],
    through_line:
      'I make interfaces that feel less like software and more like instruments you practice.',
    current_situation:
      'Just finished an MFA, running a small freelance practice, looking for a staff role at a design-forward team.',
    roles: [
      {
        id: 'r1',
        title: 'Design Engineer',
        company: 'Mirror Studio',
        start: '2024',
        summary: 'Built the client-facing editor for an interactive exhibition.',
        proudest: 'A single keyboard shortcut that saved the installation team 20 minutes per setup.',
        stack: 'React, Three.js, WebMIDI',
      },
      {
        id: 'r2',
        title: 'Teaching Assistant',
        company: 'SVA IxD',
        start: '2023',
        end: '2024',
        summary: 'TA for Thesis 2 — helped 14 students ship their capstone projects.',
        proudest: 'Zero students missed their deadline.',
      },
      {
        id: 'r3',
        title: 'Freelance Developer',
        company: 'Self',
        start: '2022',
        summary: 'Shipped sites and prototypes for small studios.',
        proudest: 'A typographic playground used in 3 classrooms.',
      },
    ],
    dream_role: 'Staff Design Engineer at a small team that ships things that feel like instruments.',
    role_tiers: {
      dream: ['Staff Design Engineer', 'Founding Design Engineer'],
      strong: ['Senior Front-End', 'Creative Technologist'],
      acceptable: ['Interaction Designer'],
    },
    target_companies: ['Linear', 'Figma', 'Vercel', 'Are.na'],
    signal_words: ['craft', 'typography', 'design engineer', 'prototype'],
    compensation_floor: 185000,
    location_constraint: 'NYC or remote US',
    remote_ok: true,
    red_flag_words: ['rockstar', 'ninja', '10x', 'wear many hats'],
    banned_words: ['spearheaded', 'leveraged', 'synergy'],
    sensitive_context: 'Career restart — left a big-ag job after burnout, took a year off.',
    voice_samples: ['less like software and more like instruments', 'things you practice'],
    projects: [
      {
        id: 'p1',
        title: 'Keyboard Garden',
        description: 'A browser synthesizer that listens to how fast you type.',
        stack: 'WebAudio, Canvas',
        serves_versions: ['B'],
      },
      {
        id: 'p2',
        title: 'Typographic Playground',
        description: 'An educational sandbox for exploring variable fonts.',
        serves_versions: ['B', 'D'],
      },
      {
        id: 'p3',
        title: 'Loop Machine',
        description: 'An 8-track step sequencer for mobile.',
      },
    ],
    recognition: ['Featured on It\'s Nice That', 'Fast Company Innovation by Design finalist'],
    versions: [
      { letter: 'A', label: 'Leader', emphasis: 'Team scaling and cross-functional leadership.' },
      { letter: 'B', label: 'Maker', emphasis: 'Hands-on building, specific stacks, shipped work.' },
      { letter: 'C', label: 'Hybrid', emphasis: 'Player-coach and founding roles.' },
      { letter: 'D', label: 'Designer', emphasis: 'Design insight, observation, restraint.' },
    ],
    ...overrides,
  };
}

describe('compileIntake — Compass contract', () => {
  it('parseCompass finds signal words from the compiled Compass', () => {
    const { compass } = compileIntake(sampleAnswers());
    const parsed = parseCompass(compass);
    expect(parsed.signal_words).toContain('craft');
    expect(parsed.signal_words).toContain('typography');
    expect(parsed.signal_words).toContain('design engineer');
    expect(parsed.signal_words).toContain('prototype');
  });

  it('parseCompass finds red flag words from the compiled Compass', () => {
    const { compass } = compileIntake(sampleAnswers());
    const parsed = parseCompass(compass);
    expect(parsed.red_flag_words).toContain('rockstar');
    expect(parsed.red_flag_words).toContain('ninja');
    expect(parsed.red_flag_words).toContain('10x');
    expect(parsed.red_flag_words).toContain('wear many hats');
  });

  it('parseCompass extracts compensation floor', () => {
    const { compass } = compileIntake(sampleAnswers({ compensation_floor: 185000 }));
    const parsed = parseCompass(compass);
    expect(parsed.compensation_floor).toBe(185000);
  });

  it('parseCompass handles empty intake without crashing', () => {
    const { compass } = compileIntake({});
    const parsed = parseCompass(compass);
    expect(parsed.signal_words).toEqual([]);
    expect(parsed.red_flag_words).toEqual([]);
    // Compensation floor defaults to 0 when no value set
    expect(parsed.compensation_floor).toBe(0);
  });

  it('compiles a Three Horizons section with H3/H2/H1 sub-headers', () => {
    const { compass } = compileIntake(sampleAnswers());
    expect(compass).toContain('## Three Horizons');
    expect(compass).toContain('### H3 — Viable future');
    expect(compass).toContain('### H2 — Seeds of innovation');
    expect(compass).toContain('### H1 — Losing fit');
  });

  it('places dream/strong/acceptable lists under their H3/H2/H1 horizons', () => {
    const { compass } = compileIntake(sampleAnswers());
    const h3Start = compass.indexOf('### H3 — Viable future');
    const h2Start = compass.indexOf('### H2 — Seeds of innovation');
    const h1Start = compass.indexOf('### H1 — Losing fit');
    expect(h3Start).toBeGreaterThan(0);
    expect(h2Start).toBeGreaterThan(h3Start);
    expect(h1Start).toBeGreaterThan(h2Start);

    const h3Block = compass.slice(h3Start, h2Start);
    const h2Block = compass.slice(h2Start, h1Start);
    const h1Block = compass.slice(h1Start);

    expect(h3Block).toContain('Staff Design Engineer');
    expect(h2Block).toContain('Senior Front-End');
    expect(h1Block).toContain('Interaction Designer');
  });

  it('includes bridge_rationale under the H2 section when present', () => {
    const { compass } = compileIntake(
      sampleAnswers({
        bridge_rationale:
          'These roles get me cross-functional reps that make me legible as a Staff Design Engineer.',
      }),
    );
    expect(compass).toContain('**What these seeds grow:**');
    expect(compass).toContain('cross-functional reps');
    // Rationale must land between H2 and H1, not after H1.
    const h2Start = compass.indexOf('### H2 — Seeds of innovation');
    const h1Start = compass.indexOf('### H1 — Losing fit');
    const rationaleAt = compass.indexOf('**What these seeds grow:**');
    expect(rationaleAt).toBeGreaterThan(h2Start);
    expect(rationaleAt).toBeLessThan(h1Start);
  });

  it('omits the bridge_rationale line when not provided', () => {
    const { compass } = compileIntake(sampleAnswers());
    expect(compass).not.toContain('**What these seeds grow:**');
  });
});

describe('compileIntake — Book contract', () => {
  it('extractRules can find Writing Rules in the compiled Book', () => {
    const { book, playbook } = compileIntake(sampleAnswers());
    const writing = extractSection(book, '## Writing Rules');
    expect(writing.length).toBeGreaterThan(0);
    expect(writing.toLowerCase()).toContain('em dashes');

    const all = extractRules(book, playbook);
    expect(all).toContain('WRITING RULES');
  });

  it('extractRules can find Things to Never Say in the compiled Book', () => {
    const { book, playbook } = compileIntake(sampleAnswers());
    const neverSay = extractSection(book, '## Things to Never Say');
    expect(neverSay.length).toBeGreaterThan(0);
    expect(neverSay).toContain('spearheaded');

    const all = extractRules(book, playbook);
    expect(all).toContain('THINGS TO NEVER SAY');
  });

  it('extractSection can find Career Timeline', () => {
    const { book } = compileIntake(sampleAnswers());
    const career = extractSection(book, '## Career Timeline');
    expect(career).toContain('Design Engineer');
    expect(career).toContain('Mirror Studio');
    expect(career).toContain('Teaching Assistant');
  });
});

describe('compileIntake — Playbook contract', () => {
  it('extractRules can find Resume Rules, Cover Letter Rules, Things to Never Do', () => {
    const { book, playbook } = compileIntake(sampleAnswers());
    const rules = extractRules(book, playbook);
    expect(rules).toContain('RESUME RULES');
    expect(rules).toContain('COVER LETTER RULES');
    expect(rules).toContain('THINGS TO NEVER DO');
  });

  it('Playbook contains `### Version X:` headers that getResumeVersionLabels can parse', () => {
    const { playbook } = compileIntake(sampleAnswers());
    // Match the regex getResumeVersionLabels uses
    const pattern = /^### Version ([A-Z]): (.+)$/gm;
    const matches: Record<string, string> = {};
    let m;
    while ((m = pattern.exec(playbook)) !== null) {
      matches[m[1]] = m[2].trim();
    }
    expect(matches['A']).toBe('Leader');
    expect(matches['B']).toBe('Maker');
    expect(matches['C']).toBe('Hybrid');
    expect(matches['D']).toBe('Designer');
  });

  it('emphasized projects land under the right Version header', () => {
    const { playbook } = compileIntake(sampleAnswers());
    // Find Version B section
    const bStart = playbook.indexOf('### Version B:');
    const cStart = playbook.indexOf('### Version C:');
    const bSection = playbook.slice(bStart, cStart);
    expect(bSection).toContain('Keyboard Garden');
    expect(bSection).toContain('Typographic Playground');
    // Version C should not include projects that don't serve it
    const cEnd = playbook.indexOf('### Version D:');
    const cSection = playbook.slice(cStart, cEnd);
    expect(cSection).not.toContain('Keyboard Garden');
  });
});

describe('compileIntake — empty and partial inputs', () => {
  it('does not crash on fully empty answers', () => {
    const { book, compass, playbook } = compileIntake({});
    expect(book).toContain('## Writing Rules');
    expect(book).toContain('## Things to Never Say');
    expect(compass).toContain('## Signal Words in Job Postings');
    expect(compass).toContain('## Red Flag Words in Job Postings');
    expect(playbook).toContain('## Resume Rules');
  });

  it('falls back to default Resume Rules when intake has none', () => {
    const { book, playbook } = compileIntake({});
    const rules = extractRules(book, playbook);
    expect(rules).toContain('Two pages is the default');
    expect(rules).toContain('Three paragraphs max');
  });

  it('falls back to default banned words when intake has none', () => {
    const { book } = compileIntake({});
    const never = extractSection(book, '## Things to Never Say');
    expect(never).toContain('spearheaded');
    expect(never).toContain('rockstar');
  });

  it('handles a role without an end date (implied Present)', () => {
    const { book } = compileIntake({
      roles: [
        {
          id: 'r1',
          title: 'Current Role',
          company: 'Nowhere Inc',
          start: '2025',
          summary: 'Doing it.',
          proudest: 'Still at it.',
        },
      ],
    });
    expect(book).toContain('2025 – Present');
  });
});
