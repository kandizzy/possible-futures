import type { GapItem } from '@/lib/types';

export function GapAnalysis({ gaps }: { gaps: GapItem[] }) {
  if (gaps.length === 0) return null;

  return (
    <section className="rise">
      <div className="flex flex-col gap-3 md:grid md:grid-cols-[8rem_1fr] md:gap-8">
        <div className="smallcaps text-[9px] text-ink-3 md:pt-1 md:sticky md:top-8">
          Gaps &amp; studies
        </div>
        <div className="space-y-8">
          {gaps.map((item, i) => (
            <div key={i}>
              <div className="flex items-baseline gap-4 mb-3">
                <span className="font-mono tabular text-[10px] text-ink-3 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h4
                  className="font-serif text-[20px] text-ink leading-snug tracking-[-0.01em]"
                  style={{ fontVariationSettings: '"opsz" 20, "SOFT" 40' }}
                >
                  {item.gap}
                </h4>
              </div>
              <p
                className="ml-7 font-serif italic text-[14px] text-ink-2 leading-[1.6] max-w-2xl mb-4"
                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 40' }}
              >
                {item.why_it_matters}
              </p>

              {item.existing_projects.length > 0 && (
                <div className="ml-7 mb-4">
                  <div className="smallcaps text-[8px] text-ink-3 mb-2">
                    Relevant work already on hand
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {item.existing_projects.map((proj) => (
                      <span
                        key={proj}
                        className="font-serif italic text-[13px] text-ink"
                        style={{ fontVariationSettings: '"opsz" 13, "SOFT" 50' }}
                      >
                        “{proj}”
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.project_ideas.length > 0 && (
                <div className="ml-7 pl-5 border-l border-rule">
                  <div className="smallcaps text-[8px] text-ink-3 mb-2">
                    Possible studies
                  </div>
                  <ul className="space-y-1.5">
                    {item.project_ideas.map((idea, j) => (
                      <li
                        key={j}
                        className="font-serif text-[13px] text-ink-2 leading-snug flex items-baseline gap-2"
                        style={{ fontVariationSettings: '"opsz" 13, "SOFT" 30' }}
                      >
                        <span className="font-mono tabular text-[9px] text-ink-3 shrink-0">
                          {String.fromCharCode(97 + j)}.
                        </span>
                        <span>{idea}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
