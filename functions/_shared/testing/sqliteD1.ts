import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { orderedMigrationStatements } from '../../../vite-dev-migrations';

/**
 * テスト用: node:sqlite（インメモリ）の上に、Functions が使う D1 API の最小部分
 * （prepare / bind / run / all / first / batch）を載せる。本番と同じ
 * `infra/d1/migrations/` を適用するため、SQL（ON CONFLICT・RETURNING 等）を
 * 実際の SQLite で検証できる。
 */
interface SqliteDb {
  prepare(sql: string): { all(...params: unknown[]): unknown[] };
  exec(sql: string): void;
}

/**
 * node:sqlite は import すると Vite が静的に解決しようとして失敗するため、
 * vite-dev-persistence.ts と同じく process.getBuiltinModule で取得する。
 */
function openDatabase(): SqliteDb {
  const getBuiltin = (process as unknown as { getBuiltinModule?: (id: string) => unknown })
    .getBuiltinModule;
  const sqlite = getBuiltin?.call(process, 'node:sqlite') as
    | { DatabaseSync?: new (filename: string) => SqliteDb }
    | undefined;
  if (sqlite?.DatabaseSync === undefined) {
    throw new Error('node:sqlite が使えません（Node 22.13 以降が必要）');
  }
  return new sqlite.DatabaseSync(':memory:');
}

export function createSqliteD1() {
  const db = openDatabase();
  const dir = path.resolve(__dirname, '../../../infra/d1/migrations');
  const files = readdirSync(dir).map((name) => ({
    name,
    content: readFileSync(path.join(dir, name), 'utf-8'),
  }));
  for (const stmt of orderedMigrationStatements(files)) db.exec(stmt);

  type Bound = { all(): Promise<{ results: Record<string, unknown>[] }> };
  const prepare = (sql: string) => ({
    bind(...args: unknown[]) {
      const rows = () => db.prepare(sql).all(...args) as Record<string, unknown>[];
      const bound = {
        async all() {
          return { results: rows() };
        },
        async run() {
          return { results: rows(), success: true };
        },
        async first() {
          return rows()[0] ?? null;
        },
      };
      return bound;
    },
  });

  return {
    prepare,
    async batch(stmts: Bound[]) {
      db.exec('BEGIN');
      try {
        const results = [];
        for (const s of stmts) results.push(await s.all());
        db.exec('COMMIT');
        return results;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    /** テストから直接中身を見るための口。 */
    raw: db,
  };
}
