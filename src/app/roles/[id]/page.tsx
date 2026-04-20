import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRoleById } from '@/lib/queries/roles';
import { getCalibrationsByRole } from '@/lib/queries/calibrations';
import { getPeopleByCompanyName } from '@/lib/queries/people';
import { getVersionLabelMap } from '@/lib/queries/source-files';
import { getTotalScore, getScoreColor } from '@/lib/types';
import type { Dimension } from '@/lib/types';
import { ScoreOverride } from '@/components/roles/score-override';
import { RecommendationOverride } from '@/components/roles/recommendation-override';
import { StatusSelect } from '@/components/roles/status-select';
import { NotesEditor } from '@/components/roles/notes-editor';
import { GapAnalysis } from '@/components/roles/gap-analysis';
import { MarkReviewedButton } from '@/components/discovery/mark-reviewed-button';
import { RoleHeaderEditor } from '@/components/roles/role-header-editor';

export default async function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = getRoleById(Number(id));

  if (!role) notFound();

  const total = getTotalScore(role.ai_scores);
  const myTotal = role.my_scores ? getTotalScore(role.my_scores) : null;
  const calibrations = getCalibrationsByRole(role.id);
  const contacts = getPeopleByCompanyName(role.company);
  const VERSION_LABELS = getVersionLabelMap();
  const dims: Dimension[] = ['want', 'can', 'grow', 'pay', 'team', 'impact'];
  const scoreCls = getScoreColor(total);

  return (
    <div className="space-y-16">
      {/* Breadcrumb */}
      <div className="rise">
        <Link
          href="/"
          className="group inline-flex items-baseline gap-2 font-serif italic text-[13px] text-ink-2 hover:text-stamp transition-colors"
          style={{ fontVariationSettings: '"opsz" 13, "SOFT" 60' }}
        >
          <span className="font-mono text-[10px] not-italic">←</span>
          <span>back to index</span>
        </Link>
      </div>

      {/* Title block — exhibition label */}
      <header className="rise" style={{ animationDelay: '60ms' }}>
        <RoleHeaderEditor
          role={{
            id: role.id,
            company: role.company,
            title: role.title,
            location: role.location,
            salary_range: role.salary_range,
            url: role.url,
          }}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 md:gap-8">
            <div className="min-w-0 flex-1">
              <div className="smallcaps text-[9px] text-ink-3 mb-4 flex items-baseline gap-4 flex-wrap">
                <span>Entry № {String(role.id).padStart(4, '0')}</span>
                {role.source === 'discovered' && (
                  <>
                    <span className="text-rule">·</span>
                    <span className="text-stamp">
                      Discovered · scan run #{role.discovered_by_run_id ?? '?'}
                    </span>
                    {!role.date_reviewed && (
                      <>
                        <span className="text-rule">·</span>
                        <MarkReviewedButton roleId={role.id} />
                      </>
                    )}
                  </>
                )}
              </div>
              <h1
                className="font-serif text-[40px] sm:text-[50px] md:text-[64px] leading-[0.9] text-ink tracking-[-0.02em]"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
              >
                {role.company}
              </h1>
              <p
                className="mt-4 md:mt-5 font-serif text-[18px] md:text-[22px] leading-snug text-ink-2 italic"
                style={{ fontVariationSettings: '"opsz" 24, "SOFT" 50' }}
              >
                {role.title}
              </p>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[12px] text-ink-2">
                {role.location && (
                  <span className="smallcaps text-[9px] text-ink-3 inline-flex items-baseline gap-1.5">
                    Located <span className="normal-case font-sans tracking-normal text-[12px] text-ink-2 not-italic">{role.location}</span>
                  </span>
                )}
                {role.salary_range && (
                  <>
                    <span className="text-ink-3">·</span>
                    <span className="smallcaps text-[9px] text-ink-3 inline-flex items-baseline gap-1.5">
                      Compensation
                      <span className="font-mono tabular normal-case tracking-normal text-[12px] text-ink-2">
                        {role.salary_range}
                      </span>
                    </span>
                  </>
                )}
              </div>
            </div>

            <Link
              href={`/roles/${role.id}/materials`}
              className="btn-stamp shrink-0 md:mt-6 self-start"
            >
              Draft Materials →
            </Link>
          </div>
        </RoleHeaderEditor>
      </header>

      {/* Gallery label — the verdict */}
      <section className="rise" style={{ animationDelay: '140ms' }}>
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-start pb-8 border-y border-rule py-8">
          {/* The score, set as a gallery plaque */}
          <div className="flex md:block items-baseline gap-6 md:gap-0 md:text-center">
            <div>
              <div className="smallcaps text-[8px] text-ink-3 mb-2">Verdict</div>
              <div
                className={`font-serif tabular text-[72px] md:text-[96px] leading-[0.85] ${scoreCls} tracking-tighter`}
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
              >
                {total}
              </div>
              <div className="font-mono tabular text-[10px] text-ink-3 mt-1">out of 18</div>
            </div>
            {myTotal !== null && myTotal !== total && (
              <div className="md:mt-3 md:pt-3 md:border-t md:border-rule">
                <div className="smallcaps text-[8px] text-ink-3">Your score</div>
                <div className="font-mono tabular text-[20px] text-ink mt-1">{myTotal}</div>
              </div>
            )}
          </div>

          {/* Recommendation + status strip */}
          <div className="space-y-5 md:pl-10 md:border-l md:border-rule pt-5 md:pt-0 border-t md:border-t-0 border-rule">
            <MetaRow label="Recommendation">
              <RecommendationOverride
                roleId={role.id}
                aiRecommendation={role.ai_recommendation}
                myRecommendation={role.my_recommendation}
              />
            </MetaRow>
            <MetaRow label="Status">
              <StatusSelect roleId={role.id} currentStatus={role.status} />
            </MetaRow>
            {role.recommended_resume_version && (
              <MetaRow label="Resume version">
                <span
                  className="font-serif italic text-[15px] text-ink"
                  style={{ fontVariationSettings: '"opsz" 15, "SOFT" 60' }}
                >
                  {VERSION_LABELS[role.recommended_resume_version] || role.recommended_resume_version}
                </span>
              </MetaRow>
            )}
            {role.date_added && (
              <MetaRow label="Added">
                <span className="font-mono tabular text-[12px] text-ink-2">
                  {role.date_added}
                </span>
              </MetaRow>
            )}
          </div>
        </div>
      </section>

      {/* Contacts */}
      {contacts.length > 0 && (
        <Section label="Contacts at this house">
          <div className="space-y-2">
            {contacts.map((p) => (
              <div key={p.id} className="flex items-baseline gap-3 text-[14px]">
                <span
                  className="font-serif text-ink"
                  style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
                >
                  {p.name}
                </span>
                {p.role && (
                  <span className="font-serif italic text-ink-2">{p.role}</span>
                )}
                {p.last_interaction && (
                  <span className="font-mono tabular text-[10px] text-ink-3">
                    last contact {p.last_interaction}
                  </span>
                )}
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif italic text-[12px] text-stamp hover:text-stamp-deep transition-colors"
                  >
                    profile →
                  </a>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Score breakdown — six plaques */}
      <Section label="Score breakdown">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {dims.map((d) => (
            <ScoreOverride
              key={d}
              roleId={role.id}
              dimension={d}
              aiScore={role.ai_scores[d]}
              myScore={role.my_scores?.[d]}
            />
          ))}
        </div>
      </Section>

      {/* Signal words + red flags */}
      {(role.signal_words_found.length > 0 || role.red_flags_found.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {role.signal_words_found.length > 0 && (
            <Section label="Signals">
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {role.signal_words_found.map((w) => (
                  <span
                    key={w}
                    className="font-serif italic text-[14px] text-ink"
                    style={{ fontVariationSettings: '"opsz" 14, "SOFT" 60' }}
                  >
                    “{w}”
                  </span>
                ))}
              </div>
            </Section>
          )}
          {role.red_flags_found.length > 0 && (
            <Section label="Red flags">
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {role.red_flags_found.map((w) => (
                  <span
                    key={w}
                    className="font-serif italic text-[14px] text-stamp line-through decoration-stamp/40"
                    style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
                  >
                    “{w}”
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Fit summary — wall text */}
      {role.fit_summary && (
        <Section label="Wall text">
          <div
            className="font-serif text-[17px] leading-[1.55] text-ink whitespace-pre-wrap max-w-2xl"
            style={{ fontVariationSettings: '"opsz" 18, "SOFT" 30' }}
          >
            {role.fit_summary}
          </div>
        </Section>
      )}

      {/* Gap analysis */}
      <GapAnalysis gaps={role.gap_analysis} />

      {/* Posting text */}
      {role.posting_text && (
        <Section label="Original posting">
          <details className="group">
            <summary className="cursor-pointer font-serif italic text-[14px] text-ink-2 hover:text-stamp transition-colors list-none">
              <span className="group-open:hidden">Reveal text →</span>
              <span className="hidden group-open:inline">Hide ←</span>
            </summary>
            <div className="mt-4 pl-5 border-l border-rule font-serif text-[13px] text-ink-2 leading-[1.7] whitespace-pre-wrap max-h-96 overflow-y-auto">
              {role.posting_text}
            </div>
          </details>
        </Section>
      )}

      {/* Calibration history */}
      {calibrations.length > 0 && (
        <Section label={`Calibration ledger · ${calibrations.length}`}>
          <ol className="divide-y divide-rule-soft border-t border-b border-rule-soft">
            {calibrations.map((cal) => {
              const delta = cal.my_score - cal.ai_score;
              return (
                <li
                  key={cal.id}
                  className="py-3 grid grid-cols-[4rem_auto_3rem] md:grid-cols-[5rem_5rem_3rem_1fr] items-baseline gap-x-4 gap-y-1 text-[13px]"
                >
                  <span className="smallcaps text-[9px] text-ink-3">
                    {cal.dimension}
                  </span>
                  <span className="font-mono tabular text-[11px] text-ink-2">
                    {cal.ai_score} → {cal.my_score}
                  </span>
                  <span
                    className={`font-mono tabular text-[11px] ${
                      delta > 0 ? 'text-stamp' : delta < 0 ? 'text-ink-2' : 'text-ink-3'
                    }`}
                  >
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </span>
                  <span
                    className="col-span-3 md:col-span-1 font-serif italic text-ink-2"
                    style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
                  >
                    {cal.reason}
                  </span>
                </li>
              );
            })}
          </ol>
        </Section>
      )}

      {/* Notes */}
      <Section label="Marginalia">
        <NotesEditor roleId={role.id} initialNotes={role.notes} />
      </Section>

      {/* Source */}
      {role.url && (
        <div className="pt-8 border-t border-rule">
          <div className="smallcaps text-[8px] text-ink-3 mb-2">Source</div>
          <a
            href={role.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-serif italic text-[13px] text-ink-2 hover:text-stamp transition-colors break-all"
            style={{ fontVariationSettings: '"opsz" 13, "SOFT" 40' }}
          >
            {role.url}
          </a>
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rise">
      <div className="grid grid-cols-[8rem_1fr] gap-8">
        <div className="smallcaps text-[9px] text-ink-3 pt-1 sticky top-8">
          {label}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="smallcaps text-[9px] text-ink-3 w-28 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
