import Link from 'next/link';
import { PageHeader, Section } from '@/components/layout/editorial';

export const metadata = {
  title: 'Colophon — Possible Futures',
  description: 'Typography, color, and components that make up the design system.',
};

export default function ColophonPage() {
  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="A Reference"
        title="The"
        tail="Colophon."
        subtitle="Every typeface, token, and component that composes Possible Futures, annotated so you can point at a thing and say what's wrong with it."
      />

      {/* I. The Faces */}
      <Section label="I · The faces">
        <div className="space-y-12">
          <Face
            name="Fraunces"
            role="Display · Italic accents · Long-form reading"
            classification="Variable serif · wght 300–700 · opsz 9–144 · SOFT 0–100 · WONK 0–1"
            why="Fraunces is the whole aesthetic. It has an optical-size axis that lets the same family behave like a newspaper body at 14pt and a 1900s poster at 144pt. The SOFT axis is what gives headings their warmth, and the WONK axis adds a tiny bit of swing to the italics that reads as 'hand-set' rather than 'rendered by a browser'. Every place you see display type, italic voice, or long-form reading in the app, it's Fraunces."
          >
            <div className="space-y-4">
              <p
                className="font-serif text-[72px] leading-[0.88] tracking-[-0.025em] text-ink"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
              >
                Possible{' '}
                <span
                  className="italic text-stamp"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}
                >
                  Futures.
                </span>
              </p>
              <p className="smallcaps text-[8px] text-ink-3">
                Display · 72 / opsz 144 · SOFT 60 · italic tail opsz 144 · SOFT 100 · WONK 1
              </p>

              <div className="pt-6 border-t border-rule-soft">
                <p
                  className="font-serif text-[28px] leading-[1.1] text-ink"
                  style={{ fontVariationSettings: '"opsz" 36, "SOFT" 40' }}
                >
                  Exhibition heading, thirty-six point.
                </p>
                <p className="mt-1 smallcaps text-[8px] text-ink-3">
                  Sub-display · 28 / opsz 36 · SOFT 40
                </p>
              </div>

              <div className="pt-6 border-t border-rule-soft">
                <p
                  className="font-serif italic text-[18px] leading-snug text-ink-2 max-w-xl"
                  style={{ fontVariationSettings: '"opsz" 18, "SOFT" 50' }}
                >
                  This is body italic. The compass wants a sentence that feels like it was set
                  by a human who cares about the rhythm of the line.
                </p>
                <p className="mt-1 smallcaps text-[8px] text-ink-3">
                  Body italic · 18 / opsz 18 · SOFT 50
                </p>
              </div>

              <div className="pt-6 border-t border-rule-soft">
                <p
                  className="font-serif text-[15px] leading-[1.7] text-ink max-w-2xl"
                  style={{ fontVariationSettings: '"opsz" 15, "SOFT" 30' }}
                >
                  At text sizes Fraunces loses most of its flair and reads like a proper
                  bookface — the opsz axis ramps up contrast as you go bigger, not smaller, so
                  long passages stay calm while display settings earn their drama.
                </p>
                <p className="mt-1 smallcaps text-[8px] text-ink-3">
                  Body roman · 15 / opsz 15 · SOFT 30
                </p>
              </div>
            </div>
          </Face>

          <Face
            name="Instrument Sans"
            role="Buttons · Form fields · Smallcaps labels · UI chrome"
            classification="Variable sans · wght 400–700 · roman + italic"
            why="A quiet workhorse. Fraunces at 10–12 point reads as 'stressed' when you just want a label to behave; Instrument Sans takes over anywhere the text is small, dense, or interactive. The two were designed by the same foundry (Instrument) and share proportions, so the pairing doesn't fight itself. If you find an Instrument Sans usage that wants to be italic or atmospheric, that's a sign it probably wants Fraunces instead."
          >
            <div className="space-y-4">
              <div className="flex items-baseline gap-4 flex-wrap">
                <button className="btn-stamp">Button · stamp</button>
                <button className="btn-ghost">Button · ghost</button>
                <a className="btn-link">link · italic</a>
              </div>
              <p className="smallcaps text-[8px] text-ink-3">
                Buttons use Instrument Sans 10 / 600, uppercase, 0.16em tracking
              </p>

              <div className="pt-6 border-t border-rule-soft">
                <input type="text" className="field max-w-sm" placeholder="form field text, 13pt" />
                <p className="mt-1 smallcaps text-[8px] text-ink-3">
                  Form field · Instrument Sans 13 · placeholder italic via serif fallback
                </p>
              </div>

              <div className="pt-6 border-t border-rule-soft">
                <div className="smallcaps text-[10px] text-ink-3">Smallcaps label</div>
                <p className="mt-1 smallcaps text-[8px] text-ink-3">
                  Instrument Sans 10 / 600, 0.18em tracking, text-transform: uppercase
                </p>
              </div>
            </div>
          </Face>

          <Face
            name="JetBrains Mono"
            role="Scores · Dates · Roman numerals · Code · Tabular figures"
            classification="Monospace · wght 400–500 · lining figures"
            why="Every number in the app is set in mono with tabular figures so scores align vertically and numerals don't jump around as values change. It's also the texture that makes the catalog feel like an archival listing rather than a spreadsheet — the roman numerals in the sidebar (I., II., III.), the entry numbers on each catalog row, the compass bearings under dates. Code blocks in the slides use it too, for the obvious reason."
          >
            <div className="space-y-5">
              <div className="flex items-baseline gap-8">
                <div>
                  <p
                    className="font-serif tabular text-[64px] leading-none text-stamp tracking-tight"
                    style={{ fontVariationSettings: '"opsz" 96, "SOFT" 40' }}
                  >
                    18
                  </p>
                  <p className="mt-1 font-mono tabular text-[10px] text-ink-3">/18</p>
                </div>
                <div>
                  <p className="font-mono tabular text-[11px] text-ink-2">
                    W3 · C3 · G3 · P3 · T3 · I3
                  </p>
                  <p className="mt-1 smallcaps text-[8px] text-ink-3">Dimension atoms</p>
                </div>
                <div>
                  <p className="font-mono tabular text-[11px] text-ink-2">2026-04-12</p>
                  <p className="mt-1 smallcaps text-[8px] text-ink-3">Date stamp</p>
                </div>
              </div>

              <div className="pt-5 border-t border-rule-soft">
                <pre className="font-mono text-[12px] leading-[1.6] text-ink bg-paper-2 border-l-2 border-ink p-4 max-w-xl">
{`npm run dev:sandbox
npm run reset:sandbox
# Possible Futures is ready to press`}
                </pre>
                <p className="mt-2 smallcaps text-[8px] text-ink-3">
                  Command card · mono 12, ink border-left, paper-2 fill
                </p>
              </div>
            </div>
          </Face>
        </div>
      </Section>

      {/* II. The palette */}
      <Section label="II · The palette">
        <div className="space-y-6">
          <p
            className="font-serif italic text-[14px] text-ink-2 max-w-xl leading-snug"
            style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
          >
            Warm paper and warm ink. The vermillion stamp is the only chromatic accent and
            it's rationed — it only shows up where the eye needs to be drawn, never as
            decoration.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Swatch token="paper" value="#f4eee4" role="Page background" />
            <Swatch token="paper-2" value="#ebe3d3" role="Card fill" />
            <Swatch token="paper-3" value="#e3d9c2" role="Deeper card" />
            <Swatch token="rule" value="#d4c6ad" role="Hairlines, borders" />
            <Swatch token="ink" value="#1a1512" role="Primary text" border />
            <Swatch token="ink-2" value="#6b5e4f" role="Secondary text" border />
            <Swatch token="ink-3" value="#a39379" role="Tertiary · meta" border />
            <Swatch token="stamp" value="#c6371f" role="The only accent" border highlight />
          </div>
        </div>
      </Section>

      {/* III. Type in context */}
      <Section label="III · Type in context">
        <div className="space-y-8">
          <p
            className="font-serif italic text-[14px] text-ink-2 max-w-xl leading-snug"
            style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
          >
            The editorial hierarchy as it shows up across the app. Each row names the role
            and the file where the rule lives so you can trace any change back to its source.
          </p>

          <HierarchyRow
            label="Display head"
            source="components/layout/editorial.tsx · PageHeader"
            sample={
              <h2
                className="font-serif text-[52px] leading-[0.9] text-ink tracking-[-0.025em]"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
              >
                An Index of{' '}
                <span
                  className="italic text-stamp"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}
                >
                  Possible Futures.
                </span>
              </h2>
            }
            note="The italic tail is the vermillion pivot for every page title. If you change the opsz or SOFT here, every page follows."
          />

          <HierarchyRow
            label="Eyebrow (smallcaps)"
            source=".smallcaps utility · globals.css"
            sample={
              <div className="smallcaps text-[10px] text-ink-3">
                I · Dashboard — a working index
              </div>
            }
            note="Instrument Sans 10 / 600, 0.18em tracking. Used for section labels, filter hints, and ledger subtitles."
          />

          <HierarchyRow
            label="Italic subtitle"
            source="PageHeader subtitle"
            sample={
              <p
                className="font-serif italic text-[17px] text-ink-2 max-w-xl leading-snug"
                style={{ fontVariationSettings: '"opsz" 18, "SOFT" 40' }}
              >
                A working catalog of roles under consideration. Scored, annotated, and kept
                close at hand.
              </p>
            }
            note="Always italic. Always under a display head. Never more than two lines."
          />

          <HierarchyRow
            label="Catalog entry title"
            source="components/roles/role-row.tsx"
            sample={
              <p
                className="font-serif text-[22px] leading-[1.05] text-ink tracking-[-0.01em]"
                style={{ fontVariationSettings: '"opsz" 30, "SOFT" 30' }}
              >
                Anthropic
              </p>
            }
            note="Company name on a dashboard row. opsz 30 keeps contrast lower than display headings so rows feel listable, not shouted."
          />

          <HierarchyRow
            label="Total score"
            source="role-row.tsx · editorial.tsx LedgerStat"
            sample={
              <p
                className="font-serif tabular text-[38px] leading-none text-stamp tracking-tight"
                style={{ fontVariationSettings: '"opsz" 48, "SOFT" 40' }}
              >
                18
              </p>
            }
            note="Scores are Fraunces with tabular figures, not JetBrains. The catalog look wants type-set numbers; JetBrains is reserved for atomic meta (dimensions, dates)."
          />

          <HierarchyRow
            label="Status (typographic, not pill)"
            source="components/roles/status-select.tsx"
            sample={
              <span
                className="font-serif text-[15px] text-stamp italic font-medium"
                style={{ fontVariationSettings: '"opsz" 15, "SOFT" 50' }}
              >
                interviewing
              </span>
            }
            note="All role and application statuses render as lowercase italic text instead of colored pills. Vermillion for active/positive states, ink-3 with strikethrough for dead states."
          />
        </div>
      </Section>

      {/* IV. Components */}
      <Section label="IV · Component atoms">
        <div className="space-y-8">
          {/* Buttons */}
          <div>
            <div className="smallcaps text-[8px] text-ink-3 mb-3">Buttons</div>
            <div className="flex items-baseline flex-wrap gap-4">
              <button className="btn-stamp">＋ Evaluate Role</button>
              <button className="btn-ghost">＋ Add Person</button>
              <button className="btn-link">cancel</button>
            </div>
            <p
              className="mt-3 font-serif italic text-[12px] text-ink-3 leading-snug max-w-xl"
              style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
            >
              The stamp button has a 2px ink shadow that shifts on hover — it's the
              strongest affordance in the app and should only be used for the primary action
              on any given screen. Ghost is for secondary. Italic link is for tertiary / cancel.
            </p>
          </div>

          {/* Chip picker */}
          <div>
            <div className="smallcaps text-[8px] text-ink-3 mb-3">Chip (italic quoted)</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {['craft', 'typography', 'design engineer', 'prototype'].map((v) => (
                <span
                  key={v}
                  className="inline-flex items-baseline gap-1 font-serif italic text-[15px] text-ink"
                  style={{ fontVariationSettings: '"opsz" 15, "SOFT" 50' }}
                >
                  &ldquo;{v}&rdquo;
                  <span className="font-mono text-[11px] not-italic text-ink-3 ml-0.5">×</span>
                </span>
              ))}
            </div>
            <p
              className="mt-3 font-serif italic text-[12px] text-ink-3 leading-snug max-w-xl"
              style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
            >
              Signal words, red flags, banned words — anything the student curates renders as
              quoted italic serif. The quotation marks are the subtle move that makes it feel
              archival.
            </p>
          </div>

          {/* Meta row */}
          <div>
            <div className="smallcaps text-[8px] text-ink-3 mb-3">Meta row</div>
            <div className="max-w-md space-y-2.5 p-5 border border-rule bg-paper-2/40">
              <div className="flex items-baseline gap-4">
                <span className="smallcaps text-[9px] text-ink-3 w-28 shrink-0">Status</span>
                <span
                  className="font-serif text-[15px] italic text-stamp font-medium"
                  style={{ fontVariationSettings: '"opsz" 15, "SOFT" 50' }}
                >
                  interviewing
                </span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="smallcaps text-[9px] text-ink-3 w-28 shrink-0">Recommendation</span>
                <span
                  className="font-serif text-[15px] italic text-stamp font-semibold"
                  style={{ fontVariationSettings: '"opsz" 15, "SOFT" 60' }}
                >
                  apply
                </span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="smallcaps text-[9px] text-ink-3 w-28 shrink-0">Resume version</span>
                <span
                  className="font-serif italic text-[15px] text-ink"
                  style={{ fontVariationSettings: '"opsz" 15, "SOFT" 60' }}
                >
                  B: Maker
                </span>
              </div>
            </div>
            <p
              className="mt-3 font-serif italic text-[12px] text-ink-3 leading-snug max-w-xl"
              style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
            >
              Labels in smallcaps, values in italic serif. Used on the role detail page and
              the publish reveal.
            </p>
          </div>

          {/* Catalog row */}
          <div>
            <div className="smallcaps text-[8px] text-ink-3 mb-3">Catalog row</div>
            <div className="max-w-3xl border-t border-b border-rule-soft py-5 px-1 grid grid-cols-[2.5rem_1fr_auto_auto] items-center gap-x-8">
              <span className="font-mono tabular text-[10px] text-ink-3 self-start pt-2">01</span>
              <div>
                <div
                  className="font-serif text-[22px] leading-[1.05] text-ink tracking-[-0.01em]"
                  style={{ fontVariationSettings: '"opsz" 30, "SOFT" 30' }}
                >
                  Anthropic
                </div>
                <div className="mt-1 text-[13px] text-ink-2">
                  Design Engineer, AI Capability · San Francisco
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className="font-serif tabular text-[38px] leading-none text-stamp tracking-tight"
                  style={{ fontVariationSettings: '"opsz" 48, "SOFT" 40' }}
                >
                  18
                </span>
                <span className="font-mono text-[9px] text-ink-3">/18</span>
              </div>
              <span
                className="font-serif text-[14px] text-stamp italic font-medium"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 50' }}
              >
                interviewing
              </span>
            </div>
            <p
              className="mt-3 font-serif italic text-[12px] text-ink-3 leading-snug max-w-xl"
              style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
            >
              This is what a single role looks like on the dashboard. Tabular index on the
              left, Fraunces title + metadata, oversized score, italic status on the right.
            </p>
          </div>
        </div>
      </Section>

      {/* V. Notes */}
      <Section label="V · Notes to a future reader">
        <div
          className="font-serif text-[15px] text-ink leading-[1.7] max-w-2xl space-y-4"
          style={{ fontVariationSettings: '"opsz" 15, "SOFT" 30' }}
        >
          <p>
            The whole system is three fonts and seven colors. If you find yourself reaching
            for a fourth font or a second accent color, pause and ask whether the existing
            atoms can do the job with a different weight, opsz, or italic switch. Editorial
            systems fail the same way every time: somebody introduces a &ldquo;just one&rdquo;
            exception and two weeks later there are nine exceptions and no system.
          </p>
          <p>
            Vermillion is load-bearing for hierarchy. It marks the italic tail of a display
            head, a strong-fit score, an active status, a published signal. It should never
            be used for decoration or for the secondary action on a screen. If a page has no
            vermillion, that means nothing on that page needs your attention urgently, and
            that's a meaningful signal in its own right.
          </p>
          <p>
            The SOFT axis on Fraunces is the single easiest knob to turn for emotional
            temperature. Higher SOFT (80–100) makes the italics feel closer to handwriting
            and is reserved for accents and reveals. Lower SOFT (20–40) keeps long-form
            reading calm. If a section feels too fussy, drop the SOFT value before you
            reach for a different font.
          </p>
          <p>
            If you want to propose a change, the fastest way to make it actionable is to
            screenshot the thing you don&apos;t like, annotate it, and open an issue
            referencing the file paths listed in section III above. Every rule in this
            system lives in a specific file — nothing is implicit.
          </p>
        </div>
      </Section>

      {/* Back link */}
      <div className="pt-8 border-t border-rule">
        <Link href="/" className="btn-link">
          ← back to the dashboard
        </Link>
      </div>
    </div>
  );
}

function Face({
  name,
  role,
  classification,
  why,
  children,
}: {
  name: string;
  role: string;
  classification: string;
  why: string;
  children: React.ReactNode;
}) {
  return (
    <article className="pb-12 border-b border-rule last:border-b-0 last:pb-0">
      <div className="grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-6 md:gap-10 items-start">
        <header>
          <h3
            className="font-serif text-[34px] leading-[0.95] text-ink tracking-[-0.015em]"
            style={{ fontVariationSettings: '"opsz" 48, "SOFT" 40' }}
          >
            {name}
          </h3>
          <p
            className="mt-2 font-serif italic text-[13px] text-ink-2 leading-snug"
            style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
          >
            {role}
          </p>
          <p className="mt-2 font-mono tabular text-[10px] text-ink-3 leading-snug">
            {classification}
          </p>
        </header>
        <div className="min-w-0">{children}</div>
      </div>
      <p
        className="mt-8 font-serif italic text-[14px] text-ink-2 leading-[1.6] max-w-2xl"
        style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
      >
        {why}
      </p>
    </article>
  );
}

function Swatch({
  token,
  value,
  role,
  border = false,
  highlight = false,
}: {
  token: string;
  value: string;
  role: string;
  border?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <div
        className={`h-20 ${border ? 'border border-rule' : ''} ${
          highlight ? 'shadow-[2px_2px_0_var(--ink)]' : ''
        }`}
        style={{ backgroundColor: value }}
      />
      <div className="mt-2 space-y-0.5">
        <div className="font-mono text-[11px] text-ink">--{token}</div>
        <div className="font-mono tabular text-[10px] text-ink-3">{value}</div>
        <div
          className="font-serif italic text-[12px] text-ink-2"
          style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
        >
          {role}
        </div>
      </div>
    </div>
  );
}

function HierarchyRow({
  label,
  source,
  sample,
  note,
}: {
  label: string;
  source: string;
  sample: React.ReactNode;
  note: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[10rem_1fr] gap-3 md:gap-8 items-start pb-6 border-b border-rule-soft">
      <div>
        <div className="smallcaps text-[9px] text-ink-3">{label}</div>
        <div className="mt-1 font-mono text-[9px] text-ink-3 leading-snug">{source}</div>
      </div>
      <div>
        <div>{sample}</div>
        <p
          className="mt-3 font-serif italic text-[12px] text-ink-2 leading-snug max-w-xl"
          style={{ fontVariationSettings: '"opsz" 12, "SOFT" 40' }}
        >
          {note}
        </p>
      </div>
    </div>
  );
}
