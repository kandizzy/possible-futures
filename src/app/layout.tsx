import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getSourceFile } from "@/lib/queries/source-files";
import { extractNameFromBook } from "@/lib/user-name";
import { isRitualAcknowledged, isFirstRun, getOnboardingState } from "@/lib/queries/onboarding";
import "./globals.css";

// Routes that bypass the ritual gate. /begin is the ritual itself; the rest
// are either the setup flow or escape hatches (settings so the user can
// always reach config, api so server actions and JSON endpoints always work).
const RITUAL_BYPASS_PREFIXES = ['/begin', '/onboarding', '/settings', '/api', '/demo'];

function shouldBypassRitualGate(pathname: string | null): boolean {
  if (!pathname) return true;
  return RITUAL_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "opsz"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Possible Futures — Job Search",
  description: "An editorial index of roles, evaluations, and applications.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const pathname = headerList.get('x-pathname');

  // Only gate users who haven't set anything up yet. Returning users (source
  // files loaded, or onboarding already completed) bypass the ritual even if
  // their DB predates the ritual_acknowledged_at column — the migration only
  // backfills existing onboarding_state rows, and users who loaded via the
  // seed script may not have one at all.
  if (
    !shouldBypassRitualGate(pathname) &&
    isFirstRun() &&
    !isRitualAcknowledged()
  ) {
    redirect('/begin');
  }

  const book = getSourceFile("PROJECT_BOOK");
  const userName = extractNameFromBook(book?.content) ?? "[Your Name]";
  const { revision_count: revisionCount } = getOnboardingState();

  // /demo routes are GIF-capture surfaces — render bare so the captured frame
  // is just the card, no sidebar or page chrome.
  const isDemo = pathname?.startsWith('/demo') ?? false;

  return (
    <html
      lang="en"
      className={`h-full antialiased ${fraunces.variable} ${instrumentSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col md:flex-row text-ink bg-paper">
        {isDemo ? (
          <main className="flex-1">{children}</main>
        ) : (
          <>
            <MobileNav userName={userName} revisionCount={revisionCount} />
            <Sidebar userName={userName} revisionCount={revisionCount} />
            <main className="flex-1 md:overflow-auto">
              <div className="max-w-5xl mx-auto px-5 sm:px-8 md:px-12 py-8 md:py-14">
                {children}
              </div>
            </main>
          </>
        )}
      </body>
    </html>
  );
}
