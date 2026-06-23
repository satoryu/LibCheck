import { describe, it, expect } from 'vitest';

import type { SearchHistoryEntry } from '@/domain/models/searchHistoryEntry';
import { SearchHistoryApiClient } from '@/data/datasources/searchHistoryApiClient';
import { ServerSearchHistoryRepositoryImpl } from '@/data/repositories/serverSearchHistoryRepositoryImpl';

function entry(isbn: string): SearchHistoryEntry {
  return { isbn, searchedAt: new Date('2026-01-01T00:00:00.000Z'), libraryStatuses: { みなと: 'available' } };
}
function jsonRes(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}

describe('SearchHistoryApiClient', () => {
  it('getAll は entries を SearchHistoryEntry にパースする', async () => {
    const fetchFn: typeof fetch = async () =>
      jsonRes({ entries: [{ isbn: '9784', searchedAt: '2026-01-01T00:00:00.000Z', libraryStatuses: { みなと: 'available' } }] });
    const client = new SearchHistoryApiClient({ fetchFn });
    const res = await client.getAll('tok');
    expect(res).toHaveLength(1);
    expect(res[0].isbn).toBe('9784');
    expect(res[0].searchedAt).toBeInstanceOf(Date);
    expect(res[0].libraryStatuses).toEqual({ みなと: 'available' });
  });

  it('saveAll は entries を ISO 文字列で PUT する', async () => {
    let captured: RequestInit | undefined;
    const fetchFn: typeof fetch = async (_u, init) => { captured = init ?? undefined; return jsonRes({ entries: [] }); };
    const client = new SearchHistoryApiClient({ fetchFn });
    await client.saveAll('tok', [entry('9784')]);
    const body = JSON.parse(String(captured?.body));
    expect(captured?.method).toBe('PUT');
    expect(body.entries[0].searchedAt).toBe('2026-01-01T00:00:00.000Z');
  });
});

class FakeApi {
  list: SearchHistoryEntry[] = [];
  async getAll(): Promise<SearchHistoryEntry[]> { return [...this.list]; }
  async saveAll(_t: string, entries: SearchHistoryEntry[]): Promise<void> { this.list = [...entries]; }
}

describe('ServerSearchHistoryRepositoryImpl', () => {
  it('save は同一 ISBN を置換し先頭に置く', async () => {
    const repo = new ServerSearchHistoryRepositoryImpl(new FakeApi() as never, () => 'tok');
    await repo.save(entry('A'));
    await repo.save(entry('B'));
    await repo.save(entry('A'));
    expect((await repo.getAll()).map((e) => e.isbn)).toEqual(['A', 'B']);
  });

  it('remove / removeAll', async () => {
    const repo = new ServerSearchHistoryRepositoryImpl(new FakeApi() as never, () => 'tok');
    await repo.save(entry('A'));
    await repo.save(entry('B'));
    await repo.remove('A');
    expect((await repo.getAll()).map((e) => e.isbn)).toEqual(['B']);
    await repo.removeAll();
    expect(await repo.getAll()).toEqual([]);
  });

  it('未認証は例外', async () => {
    const repo = new ServerSearchHistoryRepositoryImpl(new FakeApi() as never, () => null);
    await expect(repo.getAll()).rejects.toThrow();
  });
});
