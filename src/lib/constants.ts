import type { Dimension, Recommendation, RoleStatus } from './types';

export const DIMENSION_LABELS: Record<Dimension, string> = {
  want: 'Want',
  can: 'Can',
  grow: 'Grow',
  pay: 'Pay',
  team: 'Team',
  impact: 'Impact',
};

export const RECOMMENDATION_STYLES: Record<string, string> = {
  apply: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  stretch: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  skip: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

export const RECOMMENDATION_LABELS: Record<string, string> = {
  apply: 'Strong fit, worth applying',
  stretch: 'Partial fit, stretch role',
  skip: 'Not a good match',
};

export const ROLE_STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-500/20 text-blue-400',
  Applied: 'bg-indigo-500/20 text-indigo-400',
  Interviewing: 'bg-violet-500/20 text-violet-400',
  Rejected: 'bg-rose-500/20 text-rose-400',
  Withdrawn: 'bg-zinc-500/20 text-zinc-400',
  Ghosted: 'bg-orange-500/20 text-orange-400',
  Offer: 'bg-emerald-500/20 text-emerald-400',
  Skipped: 'bg-zinc-500/20 text-zinc-500',
};

export const APP_STATUS_COLORS: Record<string, string> = {
  Submitted: 'bg-blue-500/20 text-blue-400',
  'Phone Screen': 'bg-indigo-500/20 text-indigo-400',
  Interview: 'bg-violet-500/20 text-violet-400',
  'Take Home': 'bg-purple-500/20 text-purple-400',
  Offer: 'bg-emerald-500/20 text-emerald-400',
  Rejected: 'bg-rose-500/20 text-rose-400',
  Withdrawn: 'bg-zinc-500/20 text-zinc-400',
};
