import { getDb } from '../db';

/**
 * Read a meta value. Returns null if the key has never been set.
 *
 * Common keys:
 * - `app_version`: stamped on every boot from package.json
 * - `data_schema_version`: bumped manually when a numbered migration ships
 * - `seen_<release>_release`: dismissable banner flags (e.g. `seen_v0_2_release`)
 */
export function getMeta(key: string): string | null {
  const row = getDb()
    .prepare('SELECT value FROM meta WHERE key = ?')
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

/** Upsert a meta value. */
export function setMeta(key: string, value: string): void {
  getDb()
    .prepare(
      `INSERT INTO meta (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
    )
    .run(key, value);
}

/** Convenience: typed helpers for the boolean-flag pattern. */
export function getMetaFlag(key: string): boolean {
  return getMeta(key) === '1';
}

export function setMetaFlag(key: string, on: boolean): void {
  setMeta(key, on ? '1' : '0');
}
