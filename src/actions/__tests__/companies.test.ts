import { describe, it, expect } from 'vitest';
import { addCompanyManually, unskipCompany, updateCompany } from '@/actions/companies';
import {
  getCompanyById,
  getCompanyByName,
  getSkippedCompanies,
  insertCompany,
  markCompanySkipped,
} from '@/lib/queries/companies';

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

describe('updateCompany', () => {
  it('updates editable fields without touching name or source', async () => {
    const id = insertCompany({
      name: 'Stripe',
      category: 'Old',
      source: 'manual',
    });
    const fd = new FormData();
    fd.set('id', String(id));
    fd.set('category', 'Payments infra');
    fd.set('why_interested', 'Strong eng culture');
    fd.set('careers_url', 'https://stripe.com/jobs');
    const result = await updateCompany(fd);

    expect(result.success).toBe(true);
    const row = getCompanyById(id);
    expect(row?.name).toBe('Stripe');
    expect(row?.category).toBe('Payments infra');
    expect(row?.why_interested).toBe('Strong eng culture');
    expect(row?.careers_url).toBe('https://stripe.com/jobs');
    expect(row?.source).toBe('manual');
  });

  it('clears empty fields to null', async () => {
    const id = insertCompany({
      name: 'Linear',
      category: 'Project mgmt',
      why_interested: 'tbd',
      source: 'manual',
    });
    const fd = new FormData();
    fd.set('id', String(id));
    fd.set('category', '');
    fd.set('why_interested', '');
    await updateCompany(fd);

    const row = getCompanyById(id);
    expect(row?.category).toBeNull();
    expect(row?.why_interested).toBeNull();
  });

  it('rejects a missing id', async () => {
    const result = await updateCompany(new FormData());
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/valid company id/i);
  });

  it('rejects an id that does not exist', async () => {
    const fd = new FormData();
    fd.set('id', '99999');
    const result = await updateCompany(fd);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });
});

describe('unskipCompany', () => {
  it('clears skipped_at and brings the company back into the watchlist', async () => {
    insertCompany({ name: 'Linear', source: 'claude_suggestion' });
    markCompanySkipped('Linear');
    const skippedBefore = getSkippedCompanies();
    expect(skippedBefore.find((c) => c.name === 'Linear')).toBeDefined();

    const id = skippedBefore.find((c) => c.name === 'Linear')!.id;
    const fd = new FormData();
    fd.set('id', String(id));
    const result = await unskipCompany(fd);

    expect(result.success).toBe(true);
    const skippedAfter = getSkippedCompanies();
    expect(skippedAfter.find((c) => c.name === 'Linear')).toBeUndefined();
  });

  it('rejects a missing id', async () => {
    const result = await unskipCompany(new FormData());
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/valid company id/i);
  });
});

describe('getSkippedCompanies', () => {
  it('returns rows with non-null skipped_at, newest first', async () => {
    insertCompany({ name: 'Co1', source: 'manual' });
    insertCompany({ name: 'Co2', source: 'manual' });
    markCompanySkipped('Co1');
    // Force a later timestamp on Co2 so we can verify ordering
    await new Promise((r) => setTimeout(r, 1100));
    markCompanySkipped('Co2');
    const skipped = getSkippedCompanies();
    expect(skipped.length).toBeGreaterThanOrEqual(2);
    expect(skipped[0].name).toBe('Co2');
  });

  it('omits companies that have never been skipped', () => {
    insertCompany({ name: 'Active', source: 'manual' });
    const skipped = getSkippedCompanies();
    expect(skipped.find((c) => c.name === 'Active')).toBeUndefined();
  });
});
