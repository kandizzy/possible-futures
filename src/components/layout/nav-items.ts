export type NavItem = { href: string; label: string; numeral: string };

// Settings intentionally lives outside this list — it's reached via the gear
// icon in the masthead/header, not as a numbered chapter.
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', numeral: 'I' },
  { href: '/evaluate', label: 'Evaluate', numeral: 'II' },
  { href: '/applications', label: 'Applications', numeral: 'III' },
  { href: '/companies', label: 'Companies', numeral: 'IV' },
  { href: '/discover', label: 'Discover', numeral: 'V' },
  { href: '/people', label: 'People', numeral: 'VI' },
  { href: '/calibrations', label: 'Calibrations', numeral: 'VII' },
  { href: '/ledger', label: 'Ledger', numeral: 'VIII' },
  { href: '/archive', label: 'Archive', numeral: 'IX' },
];
