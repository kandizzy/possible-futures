import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { greenhouseAdapter } from '../ats/greenhouse';
import { leverAdapter } from '../ats/lever';
import { ashbyAdapter } from '../ats/ashby';
import { workableAdapter } from '../ats/workable';

// Fixture helper. The JSON files in ./fixtures/ are captured from real vendor
// responses (Greenhouse: Anthropic's first 3 jobs; Lever: leverdemo;
// Ashby: Ashby's own job board) or hand-crafted to match the documented
// schema (Workable). If a vendor ever changes their field names these tests
// will fail with a clear mismatch.
function loadFixture(name: string): unknown {
  const p = path.join(__dirname, 'fixtures', `${name}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

/**
 * Install a fake global.fetch that responds with the given fixture body on
 * the next call. Returns a spy so tests can assert on the URL that was hit.
 * We type the spy so `spy.mock.calls[0][0]` resolves to `string | URL | Request`.
 */
type FetchFn = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

function mockFetchOnce(fixture: unknown, ok = true, status = 200) {
  const fn = vi.fn<FetchFn>(async () =>
    ({
      ok,
      status,
      json: async () => fixture,
    }) as unknown as Response,
  );
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ----------------------------------------------------------------------------
// Greenhouse
// ----------------------------------------------------------------------------

describe('greenhouseAdapter', () => {
  it('maps real Greenhouse response to DiscoveredPosting[]', async () => {
    const fixture = loadFixture('greenhouse');
    const spy = mockFetchOnce(fixture);

    const results = await greenhouseAdapter.fetchPostings('anthropic', 'Anthropic');

    // URL shape
    expect(spy).toHaveBeenCalledTimes(1);
    const url = String(spy.mock.calls[0][0]);
    expect(url).toBe(
      'https://boards-api.greenhouse.io/v1/boards/anthropic/jobs?content=true',
    );

    // All jobs are mapped
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.ats_provider).toBe('greenhouse');
      expect(r.company).toBe('Anthropic');
      expect(typeof r.title).toBe('string');
      expect(typeof r.url).toBe('string');
      expect(r.url).toContain('greenhouse.io');
      expect(r.posting_text.length).toBeGreaterThan(0);
      // posting_text should start with the title (from the adapter's
      // `${title}\n\n${body}` template)
      expect(r.posting_text.startsWith(r.title)).toBe(true);
    }
  });

  it('decodes double-encoded HTML entities in Greenhouse content', async () => {
    const fixture = loadFixture('greenhouse') as { jobs: Array<{ content: string }> };
    // Real Greenhouse content routinely looks like "&lt;p&gt;" — verify that
    // after adapter processing, none of those survive into posting_text.
    mockFetchOnce(fixture);

    const results = await greenhouseAdapter.fetchPostings('anthropic', 'Anthropic');

    for (const r of results) {
      expect(r.posting_text).not.toMatch(/&lt;|&amp;|&quot;|&#39;/);
    }
  });

  it('returns [] on non-OK response', async () => {
    mockFetchOnce({}, false, 404);
    const results = await greenhouseAdapter.fetchPostings('doesnotexist', 'None');
    expect(results).toEqual([]);
  });

  it('returns [] when jobs array is missing or malformed', async () => {
    mockFetchOnce({ unexpected: 'shape' });
    const results = await greenhouseAdapter.fetchPostings('anthropic', 'Anthropic');
    expect(results).toEqual([]);
  });
});

// ----------------------------------------------------------------------------
// Lever
// ----------------------------------------------------------------------------

describe('leverAdapter', () => {
  it('maps real Lever response to DiscoveredPosting[]', async () => {
    const fixture = loadFixture('lever');
    const spy = mockFetchOnce(fixture);

    const results = await leverAdapter.fetchPostings('leverdemo', 'LeverDemo');

    expect(spy).toHaveBeenCalledTimes(1);
    const url = String(spy.mock.calls[0][0]);
    expect(url).toBe('https://api.lever.co/v0/postings/leverdemo?mode=json');

    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.ats_provider).toBe('lever');
      expect(r.company).toBe('LeverDemo');
      expect(r.url).toContain('jobs.lever.co');
      expect(r.posting_text.length).toBeGreaterThan(0);
    }
  });

  it('uses descriptionPlain when available (no HTML residue)', async () => {
    const fixture = loadFixture('lever');
    mockFetchOnce(fixture);

    const results = await leverAdapter.fetchPostings('leverdemo', 'LeverDemo');

    for (const r of results) {
      // descriptionPlain is already plain text, so no <tag> markers should appear
      expect(r.posting_text).not.toMatch(/<[a-z][^>]*>/i);
    }
  });

  it('returns [] on non-array response', async () => {
    mockFetchOnce({ not: 'an array' });
    const results = await leverAdapter.fetchPostings('x', 'X');
    expect(results).toEqual([]);
  });

  it('returns [] on 404', async () => {
    mockFetchOnce([], false, 404);
    const results = await leverAdapter.fetchPostings('x', 'X');
    expect(results).toEqual([]);
  });
});

// ----------------------------------------------------------------------------
// Ashby
// ----------------------------------------------------------------------------

describe('ashbyAdapter', () => {
  it('maps real Ashby response to DiscoveredPosting[]', async () => {
    const fixture = loadFixture('ashby');
    const spy = mockFetchOnce(fixture);

    const results = await ashbyAdapter.fetchPostings('Ashby', 'Ashby');

    expect(spy).toHaveBeenCalledTimes(1);
    const url = String(spy.mock.calls[0][0]);
    expect(url).toBe(
      'https://api.ashbyhq.com/posting-api/job-board/Ashby?includeCompensation=true',
    );

    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.ats_provider).toBe('ashby');
      expect(r.company).toBe('Ashby');
      expect(r.url).toContain('jobs.ashbyhq.com');
      expect(r.posting_text.length).toBeGreaterThan(0);
    }
  });

  it('prefers descriptionPlain over descriptionHtml when both are present', async () => {
    const fixture = loadFixture('ashby');
    mockFetchOnce(fixture);

    const results = await ashbyAdapter.fetchPostings('Ashby', 'Ashby');

    // Ashby fixtures include descriptionPlain — verify the adapter used it
    // (we can only assert there are no obvious HTML tags left over)
    for (const r of results) {
      expect(r.posting_text).not.toMatch(/<(p|div|h\d|li|ul|ol)[\s>]/i);
    }
  });

  it('returns [] on non-OK response', async () => {
    mockFetchOnce({}, false, 500);
    const results = await ashbyAdapter.fetchPostings('x', 'X');
    expect(results).toEqual([]);
  });
});

// ----------------------------------------------------------------------------
// Workable
// ----------------------------------------------------------------------------

describe('workableAdapter', () => {
  it('maps hand-crafted fixture to DiscoveredPosting[]', async () => {
    const fixture = loadFixture('workable');
    const spy = mockFetchOnce(fixture);

    const results = await workableAdapter.fetchPostings('example-co', 'Example Co');

    expect(spy).toHaveBeenCalledTimes(1);
    const url = String(spy.mock.calls[0][0]);
    expect(url).toBe(
      'https://apply.workable.com/api/v1/widget/accounts/example-co?details=true',
    );

    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('Senior Product Designer');
    expect(results[0].location).toBe('Stockholm, Stockholms län, Sweden');
    expect(results[0].ats_provider).toBe('workable');
    expect(results[0].posting_text).toContain('Senior Product Designer');
    expect(results[0].posting_text).toContain('end-to-end design');
    // HTML stripped
    expect(results[0].posting_text).not.toMatch(/<[a-z][^>]*>/i);
  });

  it('uses "Remote" when only telecommuting is set', async () => {
    const fixture = loadFixture('workable');
    mockFetchOnce(fixture);

    const results = await workableAdapter.fetchPostings('example-co', 'Example Co');
    expect(results[1].location).toBe('Remote');
  });

  it('falls back to a constructed URL when job has no url field', async () => {
    const fixture = loadFixture('workable');
    mockFetchOnce(fixture);

    const results = await workableAdapter.fetchPostings('example-co', 'Example Co');
    // Second job has no `url` but has `shortcode` — adapter should construct one
    expect(results[1].url).toContain('apply.workable.com/example-co/j/E5F6G7H8');
  });

  it('returns [] on non-OK response', async () => {
    mockFetchOnce({}, false, 404);
    const results = await workableAdapter.fetchPostings('x', 'X');
    expect(results).toEqual([]);
  });
});
