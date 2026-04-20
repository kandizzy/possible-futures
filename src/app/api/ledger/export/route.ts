import { getAllUsage } from '@/lib/queries/ai-usage';

function escapeCsv(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const rows = getAllUsage();

  const header = [
    'id',
    'timestamp',
    'operation',
    'model',
    'input_tokens',
    'output_tokens',
    'cache_read_tokens',
    'cache_write_tokens',
    'cost_usd',
    'context_type',
    'context_id',
    'error',
  ];

  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.timestamp,
        r.operation,
        r.model,
        r.input_tokens,
        r.output_tokens,
        r.cache_read_tokens,
        r.cache_write_tokens,
        r.cost_usd.toFixed(6),
        r.context_type,
        r.context_id,
        r.error,
      ]
        .map(escapeCsv)
        .join(','),
    );
  }

  const csv = lines.join('\n');
  const filename = `ledger-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
