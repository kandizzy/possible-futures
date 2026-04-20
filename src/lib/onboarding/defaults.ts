/**
 * Starter suggestions for chip pickers throughout the intake.
 * Students can accept, reject, or add to these. Generic enough to ship
 * in an open-source release.
 */

export const SUGGESTED_SIGNAL_WORDS = [
  'small team',
  'founding',
  'mentorship',
  'end-to-end',
  'craft',
  'prototype',
  'ship',
  'cross-functional',
  '0-to-1',
  'design systems',
  'infrastructure',
  'data-driven',
  'research',
  'user-facing',
  'developer tools',
  'open source',
  'distributed systems',
  'education',
  'creative technology',
  'product-minded',
];

export const SUGGESTED_RED_FLAG_WORDS = [
  'rockstar',
  'ninja',
  'guru',
  '10x',
  'wear many hats',
  'unlimited PTO',
  'move fast and break things',
  'hustle',
  'crushing it',
  'synergy',
  'work hard play hard',
  'fast-paced environment',
];

export const SUGGESTED_BANNED_WORDS = [
  'spearheaded',
  'leveraged',
  'utilized',
  'facilitated',
  'synergy',
  'cutting-edge',
  'self-taught',
  'passionate',
  'rockstar',
  'guru',
  'results-driven',
  'team player',
];

export const SUGGESTED_COMPANIES_BY_CATEGORY: Record<string, string[]> = {
  'AI & Research': [
    'Anthropic',
    'OpenAI',
    'Google DeepMind',
    'Hugging Face',
    'Mistral',
    'Cohere',
  ],
  'Developer Tools & Infrastructure': [
    'Vercel',
    'Linear',
    'Replit',
    'Supabase',
    'Cloudflare',
    'Datadog',
    'Planetscale',
    'Railway',
  ],
  'Design & Product': [
    'Figma',
    'Notion',
    'Framer',
    'Raycast',
    'Are.na',
    'Pitch',
    'Miro',
  ],
  'Consumer & Media': [
    'Spotify',
    'Substack',
    'Discord',
    'Arc Browser',
    'Strava',
  ],
  'Education & Learning': [
    'Khan Academy',
    'Duolingo',
    'Brilliant',
    'LEGO Education',
    'Coursera',
    'Scratch Foundation',
  ],
  'Health & Science': [
    'Flatiron Health',
    'Color Health',
    'Tempus',
    'Benchling',
  ],
  'Studios & Agencies': [
    'IDEO',
    'R/GA',
    'Moment Factory',
    'Teenage Engineering',
    'Instrument',
  ],
};

export const SUGGESTED_ROLE_TIERS = {
  dream: [
    'Staff Engineer',
    'Principal Engineer',
    'Founding Engineer',
    'Staff Product Manager',
    'Staff Designer',
    'Research Scientist',
    'Engineering Manager',
  ],
  strong: [
    'Senior Software Engineer',
    'Senior Product Manager',
    'Senior Product Designer',
    'Senior Data Scientist',
    'Tech Lead',
    'Design Technologist',
  ],
  acceptable: [
    'Software Engineer',
    'Product Manager',
    'Product Designer',
    'Data Analyst',
    'UX Engineer',
    'Solutions Architect',
  ],
};

/**
 * Sample paragraph for the Chapter 4 voice-highlight game. Students click the
 * phrases that sound like them; their selections feed into the Book's
 * voice calibration section.
 */
export const VOICE_SAMPLE_PARAGRAPH = `I like working on things that matter to someone specific, not things that are supposed to matter to everyone. I'd rather ship something small and right than something big and approximate. Most of what I know, I figured out by doing it wrong the first time. I want to work with people who explain their reasoning, not just their conclusions. I care more about whether something works than whether it's impressive. I've said no to roles that paid well because the work felt empty, and I'd do it again.`;

export const HIGHLIGHT_PHRASE_CANDIDATES = [
  'matter to someone specific',
  'ship something small and right',
  'figured out by doing it wrong the first time',
  'explain their reasoning, not just their conclusions',
  'whether something works than whether it\'s impressive',
  'said no to roles that paid well because the work felt empty',
];
