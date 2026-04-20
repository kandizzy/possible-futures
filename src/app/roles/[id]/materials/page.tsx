import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRoleById } from '@/lib/queries/roles';
import { getTotalScore, getScoreColor } from '@/lib/types';
import { getVersionLabelMap } from '@/lib/queries/source-files';
import { getMaterialsMode } from '@/lib/queries/compass';
import { MaterialsGenerator } from '@/components/materials/materials-generator';

export default async function MaterialsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = getRoleById(Number(id));

  if (!role) notFound();

  const total = getTotalScore(role.ai_scores);
  const scoreCls = getScoreColor(total);
  const versionLabels = getVersionLabelMap();
  const materialsMode = getMaterialsMode();

  return (
    <div className="space-y-12">
      {/* Breadcrumb */}
      <div className="rise">
        <Link
          href={`/roles/${role.id}`}
          className="group inline-flex items-baseline gap-2 font-serif italic text-[13px] text-ink-2 hover:text-stamp transition-colors"
          style={{ fontVariationSettings: '"opsz" 13, "SOFT" 60' }}
        >
          <span className="font-mono text-[10px] not-italic">←</span>
          <span>back to {role.title}</span>
        </Link>
      </div>

      {/* Title block */}
      <header className="rise" style={{ animationDelay: '60ms' }}>
        <div className="smallcaps text-[9px] text-ink-3 mb-3">
          Workshop · Entry № {String(role.id).padStart(4, '0')}
        </div>
        <div className="flex items-end justify-between gap-8">
          <div className="min-w-0 flex-1">
            <h1
              className="font-serif text-[56px] leading-[0.88] text-ink tracking-[-0.025em]"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 60' }}
            >
              Draft <span className="italic text-stamp" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>materials.</span>
            </h1>
            <p
              className="mt-4 font-serif italic text-[17px] text-ink-2 leading-snug"
              style={{ fontVariationSettings: '"opsz" 17, "SOFT" 50' }}
            >
              For {role.title} at {role.company}.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="smallcaps text-[8px] text-ink-3">Verdict</div>
            <div
              className={`font-serif tabular text-[56px] leading-none ${scoreCls} tracking-tight`}
              style={{ fontVariationSettings: '"opsz" 72, "SOFT" 40' }}
            >
              {total}
            </div>
            <div className="font-mono tabular text-[9px] text-ink-3">/18</div>
          </div>
        </div>
      </header>

      <div className="rise" style={{ animationDelay: '140ms' }}>
        <MaterialsGenerator
          roleId={role.id}
          roleTitle={role.title}
          company={role.company}
          versionLabels={versionLabels}
          materialsMode={materialsMode}
        />
      </div>
    </div>
  );
}
