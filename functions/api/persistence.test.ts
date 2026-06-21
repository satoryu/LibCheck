// @vitest-environment node
import { describe, it, expect } from 'vitest';

import {
  onRequestGet as rlGet,
  onRequestPut as rlPut,
} from './registered-libraries.js';
import {
  onRequestGet as shGet,
  onRequestPut as shPut,
} from './search-history.js';
import { MOCK_ID_TOKEN } from '../_shared/googleAuth.js';

/** D1 を最小実装で模す（user_id でフィルタ・DELETE/INSERT・batch）。 */
function makeFakeDB() {
  const tables: Record<string, Record<string, unknown>[]> = {
    registered_libraries: [],
    search_history: [],
  };
  const tableOf = (sql: string) => /(?:FROM|INTO)\s+(\w+)/i.exec(sql)?.[1] ?? '';
  function exec(sql: string, args: unknown[]) {
    const t = tableOf(sql);
    if (/^\s*DELETE/i.test(sql)) {
      tables[t] = tables[t].filter((r) => r.user_id !== args[0]);
      return;
    }
    const m = /INSERT(?:\s+OR\s+REPLACE)?\s+INTO\s+\w+\s*\(([^)]+)\)/i.exec(sql);
    if (m) {
      const cols = m[1].split(',').map((s) => s.trim());
      const row: Record<string, unknown> = {};
      cols.forEach((c, i) => {
        row[c] = args[i];
      });
      tables[t].push(row);
    }
  }
  return {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            _sql: sql,
            _args: args,
            async all() {
              return {
                results: tables[tableOf(sql)].filter(
                  (r) => r.user_id === args[0],
                ),
              };
            },
            async run() {
              exec(sql, args);
              return { success: true };
            },
          };
        },
      };
    },
    async batch(stmts: { _sql: string; _args: unknown[] }[]) {
      for (const s of stmts) exec(s._sql, s._args);
      return [];
    },
  };
}

const AUTH = { authorization: `Bearer ${MOCK_ID_TOKEN}` };

function ctx(
  method: string,
  headers: Record<string, string>,
  env: Record<string, unknown>,
  body?: unknown,
) {
  const init: RequestInit = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);
  return { request: new Request('https://x/api/x', init), env } as never;
}

const lib1 = {
  systemId: 'Sys1', systemName: 's1', libKey: 'k1', libId: 'i1',
  shortName: 'a', formalName: 'A図書館', address: 'addr', pref: '東京都',
  city: '港区', category: 'MEDIUM',
};
const lib2 = { ...lib1, systemId: 'Sys2', libKey: 'k2', libId: 'i2', formalName: 'B図書館' };

describe('/api/registered-libraries', () => {
  it('認証なしは 401', async () => {
    const res = await rlGet(ctx('GET', {}, { AUTH_MOCK: '1', DB: makeFakeDB() }));
    expect(res.status).toBe(401);
  });

  it('PUT→GET でラウンドトリップする', async () => {
    const env = { AUTH_MOCK: '1', DB: makeFakeDB() };
    const put = await rlPut(ctx('PUT', AUTH, env, { libraries: [lib1, lib2] }));
    expect(put.status).toBe(200);
    const get = await rlGet(ctx('GET', AUTH, env));
    const body = (await get.json()) as { libraries: { systemId: string }[] };
    expect(body.libraries.map((l) => l.systemId)).toEqual(['Sys1', 'Sys2']);
  });

  it('PUT は全置換（前のデータを消す）', async () => {
    const env = { AUTH_MOCK: '1', DB: makeFakeDB() };
    await rlPut(ctx('PUT', AUTH, env, { libraries: [lib1, lib2] }));
    await rlPut(ctx('PUT', AUTH, env, { libraries: [lib2] }));
    const get = await rlGet(ctx('GET', AUTH, env));
    const body = (await get.json()) as { libraries: { systemId: string }[] };
    expect(body.libraries.map((l) => l.systemId)).toEqual(['Sys2']);
  });

  it('不正な body は 400', async () => {
    const env = { AUTH_MOCK: '1', DB: makeFakeDB() };
    const res = await rlPut(ctx('PUT', AUTH, env, { nope: true }));
    expect(res.status).toBe(400);
  });
});

describe('/api/search-history', () => {
  it('PUT→GET でラウンドトリップする', async () => {
    const env = { AUTH_MOCK: '1', DB: makeFakeDB() };
    const entries = [
      {
        isbn: '9784873117584',
        searchedAt: '2026-01-01T00:00:00.000Z',
        libraryStatuses: { みなと: 'available' },
      },
    ];
    await shPut(ctx('PUT', AUTH, env, { entries }));
    const get = await shGet(ctx('GET', AUTH, env));
    const body = (await get.json()) as {
      entries: { isbn: string; searchedAt: string; libraryStatuses: Record<string, string> }[];
    };
    expect(body.entries).toHaveLength(1);
    expect(body.entries[0].isbn).toBe('9784873117584');
    expect(body.entries[0].searchedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(body.entries[0].libraryStatuses).toEqual({ みなと: 'available' });
  });
});
