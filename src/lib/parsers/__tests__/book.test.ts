import { describe, it, expect } from 'vitest';
import {
  parseContactFromBook,
  parseEducationFromBook,
  parseThroughLine,
  parseRolesFromBook,
  parseProjectsFromBook,
  parseVersionsFromBook,
  parseSensitiveContext,
  parseRecognition,
  parseScoringContext,
} from '../book';
import { compileIntake } from '../../onboarding/compile';

// Hand-written Book format fixture
const HAND_WRITTEN = `# Jane Doe: Project Book

## Contact & Basics

- **Name:** Jane Doe
- **Location:** Portland, OR
- **Email:** jane@example.com
- **Website:** janedoe.dev
- **Education:** BS, Computer Science, MIT; Coursera Deep Learning Certificate (Andrew Ng)

---

## Positioning Statement

_What makes you different._

Jane builds tools that make complex systems understandable. Her work spans data visualization, developer tooling, and infrastructure monitoring.

---

## AI Scoring Context

- **Dream role:** Staff Engineer at a developer tools company
- **Current situation:** Three years into a senior role, ready for staff

## Career Timeline

### Staff Engineer | Datadog

**Jan 2022 - Present**

- Led the metrics query engine rewrite, improving p99 latency by 40%
- Architected the new alerting pipeline serving 50k customers
- **Tech:** Go, Kafka, ClickHouse, React

**Key achievement:** Shipped the query engine rewrite in 3 months with zero downtime.

### Senior Frontend Engineer | Stripe

**Mar 2019 - Dec 2021**

- Built the new Dashboard billing components used by 100k merchants
- Mentored 4 junior engineers through the IC growth framework
- **Tech:** TypeScript, React, Ruby

### Previous Experience (compressed section on resume)

**Junior Developer, Acme Corp**

**2016 - 2019**

- Built internal tools for the sales team

## Independent Projects

### Query Playground (2023)

An interactive SQL query builder with real-time visualization of execution plans.

- **Tech:** TypeScript, D3.js, PostgreSQL

### Consulting Projects: Data Infrastructure (2020-2022)

**Metrics Pipeline for FinTech Startup**
- Built real-time metrics aggregation pipeline
- **Tech:** Go, Kafka, InfluxDB

**Dashboard for Healthcare Analytics**
- Interactive dashboards for clinical trial data
- **Tech:** React, D3.js, Python

## Recognition & Exhibitions

### Awards

- Company Hack Week Winner (2023) - Query Playground
- Stripe Engineering Excellence Award (2021)

### Talks & Writing

- "Building Query Engines" at GoConf 2023
- Blog post series on distributed systems

## Sensitive Context

_Private notes._

- Left Stripe for Datadog because Stripe's eng culture was shifting toward process-heavy management.

## Two-Version Strategy

### Version A: The Systems Builder

_For: Staff/Principal Engineer, Infrastructure, Backend roles_

Emphasizes: distributed systems, query engines, performance engineering, technical leadership.

### Version B: The Full-Stack Lead

_For: Senior/Staff Full-Stack, Tech Lead roles_

Emphasizes: frontend architecture, mentorship, shipping user-facing products.
`;

// Compiled Book format (from compileIntake)
const COMPILED = compileIntake({
  name: 'Test User',
  email: 'test@test.com',
  location: 'NYC',
  website: 'test.dev',
  education: [{ degree: 'MS Computer Science', school: 'Stanford', year: '2020' }],
  through_line: 'I build tools that developers love.',
  current_situation: 'Looking for my next staff role.',
  roles: [
    { id: '1', title: 'Staff Engineer', company: 'Vercel', start: '2022', end: 'Present', summary: 'Led the Edge Runtime team.', proudest: 'Shipped Edge Functions globally.' },
    { id: '2', title: 'Senior Engineer', company: 'Netlify', start: '2019', end: '2022', summary: 'Built the deploy pipeline.', proudest: 'Cut deploy times by 60%.' },
    { id: '3', title: 'Engineer', company: 'Heroku', start: '2017', end: '2019', summary: 'Worked on the platform team.', proudest: 'Launched private spaces.' },
  ],
  signal_words: ['developer tools', 'edge computing'],
  red_flag_words: ['rockstar', 'ninja'],
  projects: [
    { id: '1', title: 'Edge Benchmark', description: 'A benchmarking tool for edge runtimes.', stack: 'Rust, WebAssembly' },
    { id: '2', title: 'Deploy CLI', description: 'A CLI for deploying apps.', stack: 'Go' },
    { id: '3', title: 'Status Page', description: 'Real-time status dashboard.', stack: 'React, WebSocket' },
  ],
  versions: [
    { letter: 'A', label: 'Primary', emphasis: 'Focus on infrastructure and performance.' },
    { letter: 'B', label: 'Technical', emphasis: 'Focus on specific tech depth.' },
  ],
}).book;

describe('Book parser', () => {
  describe('parseContactFromBook', () => {
    it('extracts contact from hand-written Book', () => {
      const contact = parseContactFromBook(HAND_WRITTEN);
      expect(contact.name).toBe('Jane Doe');
      expect(contact.email).toBe('jane@example.com');
      expect(contact.location).toBe('Portland, OR');
      expect(contact.website).toBe('janedoe.dev');
    });

    it('extracts name from compiled Book', () => {
      const contact = parseContactFromBook(COMPILED);
      expect(contact.name).toBe('Test User');
    });

    it('returns empty object for empty content', () => {
      expect(parseContactFromBook('')).toEqual({});
    });
  });

  describe('parseEducationFromBook', () => {
    it('parses single-line semicolon format', () => {
      const edu = parseEducationFromBook(HAND_WRITTEN);
      expect(edu.length).toBe(2);
      expect(edu[0].degree).toBe('BS, Computer Science');
      expect(edu[0].school).toBe('MIT');
    });

    it('parses multi-line format from compiled Book', () => {
      const edu = parseEducationFromBook(COMPILED);
      expect(edu.length).toBeGreaterThanOrEqual(1);
      expect(edu[0].school).toContain('Stanford');
    });

    it('returns empty array for missing education', () => {
      expect(parseEducationFromBook('# No education here')).toEqual([]);
    });
  });

  describe('parseThroughLine', () => {
    it('extracts positioning statement', () => {
      const tl = parseThroughLine(HAND_WRITTEN);
      expect(tl).toContain('Jane builds tools');
    });

    it('strips italic description lines', () => {
      const tl = parseThroughLine(HAND_WRITTEN);
      expect(tl).not.toContain('What makes you different');
    });

    it('returns undefined for missing section', () => {
      expect(parseThroughLine('# No positioning here')).toBeUndefined();
    });
  });

  describe('parseRolesFromBook', () => {
    it('extracts roles with pipe separator', () => {
      const roles = parseRolesFromBook(HAND_WRITTEN);
      expect(roles.length).toBeGreaterThanOrEqual(3);
      expect(roles[0].title).toBe('Staff Engineer');
      expect(roles[0].company).toBe('Datadog');
      expect(roles[0].start).toBe('Jan 2022');
      expect(roles[0].end).toBe('Present');
    });

    it('extracts summary from first bullet', () => {
      const roles = parseRolesFromBook(HAND_WRITTEN);
      expect(roles[0].summary).toContain('metrics query engine');
    });

    it('extracts stack from **Tech:** line', () => {
      const roles = parseRolesFromBook(HAND_WRITTEN);
      expect(roles[0].stack).toContain('Go');
      expect(roles[0].stack).toContain('Kafka');
    });

    it('preserves full body in raw_notes', () => {
      const roles = parseRolesFromBook(HAND_WRITTEN);
      expect(roles[0].raw_notes).toContain('Key achievement');
      expect(roles[0].raw_notes!.length).toBeGreaterThan(100);
    });

    it('handles Previous Experience as special case', () => {
      const roles = parseRolesFromBook(HAND_WRITTEN);
      const prev = roles.find((r) => r.title === 'Previous Experience');
      expect(prev).toBeDefined();
      expect(prev!.raw_notes).toContain('Junior Developer');
    });

    it('extracts roles from compiled Book', () => {
      const roles = parseRolesFromBook(COMPILED);
      expect(roles.length).toBeGreaterThanOrEqual(3);
    });

    it('returns empty array for missing timeline', () => {
      expect(parseRolesFromBook('# No timeline here')).toEqual([]);
    });
  });

  describe('parseProjectsFromBook', () => {
    it('extracts projects with tech stacks', () => {
      const projects = parseProjectsFromBook(HAND_WRITTEN);
      expect(projects.length).toBeGreaterThanOrEqual(1);
      const qp = projects.find((p) => p.title === 'Query Playground');
      expect(qp).toBeDefined();
      expect(qp!.stack).toContain('TypeScript');
    });

    it('extracts consulting sub-projects', () => {
      const projects = parseProjectsFromBook(HAND_WRITTEN);
      const metrics = projects.find((p) => p.title.includes('Metrics Pipeline'));
      expect(metrics).toBeDefined();
      expect(metrics!.stack).toContain('Go');
    });

    it('returns empty array for missing section', () => {
      expect(parseProjectsFromBook('# No projects here')).toEqual([]);
    });
  });

  describe('parseVersionsFromBook', () => {
    it('extracts versions from hand-written format', () => {
      const versions = parseVersionsFromBook(HAND_WRITTEN);
      expect(versions.length).toBe(2);
      expect(versions[0].letter).toBe('A');
      expect(versions[0].label).toBe('The Systems Builder');
      expect(versions[0].emphasis).toContain('distributed systems');
    });

    it('returns empty array for missing section', () => {
      expect(parseVersionsFromBook('# No versions here')).toEqual([]);
    });
  });

  describe('parseSensitiveContext', () => {
    it('extracts sensitive context', () => {
      const sc = parseSensitiveContext(HAND_WRITTEN);
      expect(sc).toContain('Left Stripe for Datadog');
    });

    it('strips italic description line', () => {
      const sc = parseSensitiveContext(HAND_WRITTEN);
      expect(sc).not.toContain('Private notes');
    });

    it('returns undefined for missing section', () => {
      expect(parseSensitiveContext('# Nothing sensitive here')).toBeUndefined();
    });
  });

  describe('parseRecognition', () => {
    it('extracts awards and talks', () => {
      const rec = parseRecognition(HAND_WRITTEN);
      expect(rec.length).toBeGreaterThanOrEqual(3);
      expect(rec.some((r) => r.includes('Hack Week'))).toBe(true);
      expect(rec.some((r) => r.includes('GoConf'))).toBe(true);
    });

    it('returns empty array for missing section', () => {
      expect(parseRecognition('# No recognition here')).toEqual([]);
    });
  });

  describe('parseScoringContext', () => {
    it('extracts dream role and current situation', () => {
      const sc = parseScoringContext(HAND_WRITTEN);
      expect(sc.dream_role).toContain('Staff Engineer');
      expect(sc.current_situation).toContain('staff');
    });
  });

  describe('roundtrip: compiled Book → parse back', () => {
    it('recovers contact info', () => {
      const contact = parseContactFromBook(COMPILED);
      expect(contact.name).toBe('Test User');
      expect(contact.email).toBe('test@test.com');
    });

    it('recovers roles', () => {
      const roles = parseRolesFromBook(COMPILED);
      expect(roles.length).toBe(3);
      const vercel = roles.find((r) => r.company === 'Vercel');
      expect(vercel).toBeDefined();
      expect(vercel!.title).toBe('Staff Engineer');
    });

    it('recovers projects', () => {
      const projects = parseProjectsFromBook(COMPILED);
      expect(projects.length).toBe(3);
      expect(projects[0].title).toBe('Edge Benchmark');
    });
  });
});
