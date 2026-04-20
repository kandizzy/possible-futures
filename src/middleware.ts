import { NextResponse, type NextRequest } from 'next/server';

// Exposes the current pathname to server components via the x-pathname header.
// The root layout reads this to enforce the ritual gate (see src/app/layout.tsx).
// Edge-safe: no DB access here, just header passthrough.
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set('x-pathname', request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Skip static assets and Next internals; match everything else.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
