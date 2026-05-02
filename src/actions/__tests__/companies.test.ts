import { describe, it, expect } from 'vitest';
import { addCompanyManually } from '@/actions/companies';
import { getCompanyByName, insertCompany } from '@/lib/queries/companies';

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

describe('addCompanyManually', () => {
  it('inserts a company with source=manual', async () => {
    const result = await addCompanyManually(fd({ name: 'Field Studies' }));
    expect(result.success).toBe(true);
    const row = getCompanyByName('Field Studies');
    expect(row).not.toBeNull();
    expect(row!.source).toBe('manual');
  });

  it('persists optional fields when provided', async () => {
    await addCompanyManually(
      fd({
        name: 'Are.na',
        category: 'Knowledge tools',
        why_interested: 'Slow social, taste-driven design.',
        careers_url: 'https://www.are.na/jobs',
      }),
    );
    const row = getCompanyByName('Are.na');
    expect(row?.category).toBe('Knowledge tools');
    expect(row?.why_interested).toBe('Slow social, taste-driven design.');
    expect(row?.careers_url).toBe('https://www.are.na/jobs');
  });

  it('rejects an empty name', async () => {
    const result = await addCompanyManually(fd({ name: '   ' }));
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/name is required/i);
  });

  it('rejects a duplicate name', async () => {
    insertCompany({ name: 'Linear', source: 'claude_suggestion' });
    const result = await addCompanyManually(fd({ name: 'Linear' }));
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already on your list/i);
  });

  it('trims whitespace before storing', async () => {
    await addCompanyManually(fd({ name: '  Vercel  ', category: '  Infra  ' }));
    const row = getCompanyByName('Vercel');
    expect(row).not.toBeNull();
    expect(row!.category).toBe('Infra');
  });
});
