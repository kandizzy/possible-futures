import { vi, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

// Module-scoped db instance — reset before each test for full isolation
let currentDb: Database.Database;

beforeEach(() => {
  currentDb = new Database(':memory:');
  currentDb.pragma('journal_mode = WAL');
  currentDb.pragma('foreign_keys = ON');
  currentDb.exec(schema);
});

// Mock the db module so all query functions use our in-memory db
vi.mock('@/lib/db', () => ({
  getDb: () => currentDb,
}));

// Mock next/cache since we run outside Next.js
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock next/navigation for client components that use useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}));
