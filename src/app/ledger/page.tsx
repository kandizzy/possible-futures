import Link from 'next/link';
import {
  getUsageTotals,
  getUsageByOperation,
  getRecentUsage,
} from '@/lib/queries/ai-usage';
import { formatUsd, getModelLabel } from '@/lib/ai/pricing';

const OPERATION_LABELS: Record<string, string> = {
  score_posting: 'Score posting',
  generate_materials: 'Generate materials',
  generate_base_resume: 'Generate base resume',
  discover_companies: 'Discover companies',
};

function labelOperation(op: string): string {
  return OPERATION_LABELS[op] ?? op;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatTimestamp(iso: string): string {
  // timestamps are stored as 'YYYY-MM-DD HH:MM:SS' in UTC by sqlite datetime('now')
  try {
    const d = new Date(iso.replace(' ', 'T') + 'Z');
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function LedgerPage() {
  const totals = getUsageTotals();
  const byOperation = getUsageByOperation();
  const recent = getRecentUsage(50);

  const avgCost = totals.total_calls > 0 ? totals.total_cost / totals.total_calls : 0;

  return (
    <div className="font-sans space-y-14">
      {/* Masthead — utilitarian: sans, not serif */}
      <header className="rise">
        <div className="smallcaps text-[10px] text-ink-3 mb-3">IX. Ledger</div>
        <h1 className="font-sans text-[40px] sm:text-[48px] md:text-[56px] leading-[0.95] text-ink tracking-[-0.02em] font-semibold">
          The Ledger.
        </h1>
        <p className="mt-4 md:mt-5 font-sans text-[14px] md:text-[15px] text-ink-2 leading-snug max-w-2xl">
          Every API call, every token, every cent. Calibrated against the rate card in{' '}
          <code className="font-mono text-[12px] text-ink">src/lib/ai/pricing.ts</code>.
          Verify against anthropic.com/pricing before trusting for accounting.
        </p>
      </header>

      {/* Top stats — mono numbers */}
      <section className="rise" style={{ animationDelay: '60ms' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 border-t border-b border-rule py-6 md:py-8">
          <StatCell
            label="Total spent"
            value={formatUsd(totals.total_cost)}
            accent
          />
          <StatCell
            label="API calls"
            value={String(totals.total_calls)}
          />
          <StatCell
            label="Avg per call"
            value={formatUsd(avgCost)}
          />
          <StatCell
            label="Cache read tokens"
            value={formatTokens(totals.total_cache_read_tokens)}
            sub={
              totals.total_cache_read_tokens > 0
                ? 'prompt cache is working'
                : 'no cache reads yet'
            }
          />
        </div>
      </section>

      {/* By operation */}
      <section className="rise" style={{ animationDelay: '120ms' }}>
        <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-rule">
          <h2 className="smallcaps text-[10px] text-ink-3">By operation</h2>
          <span className="font-mono tabular text-[10px] text-ink-3">
            {String(byOperation.length).padStart(2, '0')} kinds
          </span>
        </div>

        {byOperation.length === 0 ? (
          <p className="font-sans italic text-[13px] text-ink-2 py-6">
            No recorded calls yet. Run an evaluation or a discovery scan to see numbers here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-[13px]">
              <thead>
                <tr className="border-b border-rule-soft text-ink-3">
                  <th className="text-left py-2 pr-4 smallcaps text-[9px] font-normal">Operation</th>
                  <th className="text-right py-2 px-3 smallcaps text-[9px] font-normal">Calls</th>
                  <th className="text-right py-2 px-3 smallcaps text-[9px] font-normal">Total</th>
                  <th className="text-right py-2 pl-3 smallcaps text-[9px] font-normal">Avg</th>
                </tr>
              </thead>
              <tbody>
                {byOperation.map((row) => (
                  <tr
                    key={row.operation}
                    className="border-b border-rule-soft/50 hover:bg-paper-2/40 transition-colors"
                  >
                    <td className="py-3 pr-4 text-ink">{labelOperation(row.operation)}</td>
                    <td className="py-3 px-3 text-right font-mono tabular text-ink">
                      {row.calls}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular text-ink">
                      {formatUsd(row.total_cost)}
                    </td>
                    <td className="py-3 pl-3 text-right font-mono tabular text-ink-2">
                      {formatUsd(row.avg_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent calls */}
      <section className="rise" style={{ animationDelay: '180ms' }}>
        <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-rule">
          <h2 className="smallcaps text-[10px] text-ink-3">Recent calls</h2>
          <Link
            href="/api/ledger/export"
            className="font-sans text-[11px] text-ink-2 hover:text-stamp transition-colors"
          >
            Export CSV →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="font-sans italic text-[13px] text-ink-2 py-6">
            Nothing logged yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-[12px]">
              <thead>
                <tr className="border-b border-rule-soft text-ink-3">
                  <th className="text-left py-2 pr-3 smallcaps text-[9px] font-normal">#</th>
                  <th className="text-left py-2 px-3 smallcaps text-[9px] font-normal">Time</th>
                  <th className="text-left py-2 px-3 smallcaps text-[9px] font-normal">Operation</th>
                  <th className="text-left py-2 px-3 smallcaps text-[9px] font-normal">Model</th>
                  <th className="text-right py-2 px-3 smallcaps text-[9px] font-normal">In / Out</th>
                  <th className="text-right py-2 px-3 smallcaps text-[9px] font-normal">Cache R/W</th>
                  <th className="text-right py-2 pl-3 smallcaps text-[9px] font-normal">Cost</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-rule-soft/50 hover:bg-paper-2/40 transition-colors"
                  >
                    <td className="py-2.5 pr-3 font-mono tabular text-ink-3">
                      {row.id}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular text-ink-2 whitespace-nowrap">
                      {formatTimestamp(row.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 text-ink">
                      {labelOperation(row.operation)}
                      {row.error && (
                        <span
                          className="ml-2 smallcaps text-[8px] text-stamp"
                          title={row.error}
                        >
                          error
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-ink-2">{getModelLabel(row.model)}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular text-ink-2">
                      {formatTokens(row.input_tokens)} / {formatTokens(row.output_tokens)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular text-ink-2">
                      {row.cache_read_tokens || row.cache_write_tokens
                        ? `${formatTokens(row.cache_read_tokens)} / ${formatTokens(row.cache_write_tokens)}`
                        : '—'}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono tabular text-ink">
                      {row.cost_usd > 0 ? formatUsd(row.cost_usd) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCell({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        className={`font-mono tabular text-[28px] md:text-[34px] leading-none tracking-tight ${
          accent ? 'text-stamp' : 'text-ink'
        }`}
      >
        {value}
      </div>
      <div className="smallcaps text-[8px] text-ink-3 mt-2">{label}</div>
      {sub && (
        <div className="font-sans italic text-[11px] text-ink-2 mt-1">{sub}</div>
      )}
    </div>
  );
}
