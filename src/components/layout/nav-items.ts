export type NavItem = { href: string; label: string; numeral: string };

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', numeral: 'I' },
  { href: '/evaluate', label: 'Evaluate', numeral: 'II' },
  { href: '/applications', label: 'Applications', numeral: 'III' },
  { href: '/companies', label: 'Companies', numeral: 'IV' },
  { href: '/discover', label: 'Discover', numeral: 'V' },
  { href: '/people', label: 'People', numeral: 'VI' },
  { href: '/calibrations', label: 'Calibrations', numeral: 'VII' },
  { href: '/settings', label: 'Settings', numeral: 'VIII' },
  { href: '/ledger', label: 'Ledger', numeral: 'IX' },
  { href: '/archive', label: 'Archive', numeral: 'X' },
];
