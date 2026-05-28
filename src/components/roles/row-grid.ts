// Shared column template for the dashboard list — used by both the row
// (role-row.tsx, a client component) and the column header (src/app/page.tsx,
// a server component). It lives in its own non-'use client' module because a
// constant exported from a client module becomes a client-reference proxy when
// imported into a server component, not the string itself.
//
// Fixed trailing tracks (index · company · shape · number · status) so the
// header labels align with the row content across the two separate grids.
export const ROW_GRID = 'grid-cols-[2.5rem_minmax(0,1fr)_3.5rem_4rem_7rem] gap-x-8';
