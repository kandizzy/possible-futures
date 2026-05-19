// Three statuses represent a concluded, recorded outcome: an offer in hand,
// a rejection actually received, or an application deliberately withdrawn.
// Moving away from any of them revises something real, so the UI asks for
// confirmation first.
//
// Everything else commits silently — forward progress, corrections, and
// moving in or out of Ghosted. Ghosted is limbo ("no response yet"), not a
// conclusion: you can mark something Ghosted and un-mark it freely, and a
// ghost can still resurface as an interview or harden into a rejection.
//
// Covers both vocabularies — role status (Offer / Rejected / Withdrawn) and
// application status (same three) — since the concluded set is identical.
const CONCLUDED = new Set(['Offer', 'Rejected', 'Withdrawn']);

export function isUnusualTransition(current: string, target: string): boolean {
  if (current === target) return false;
  return CONCLUDED.has(current);
}

export function unusualTransitionReason(current: string, target: string): string {
  return `This is already marked ${current.toLowerCase()} — a concluded outcome. Changing it to ${target.toLowerCase()} revises that.`;
}
