import { describe, expect, test } from 'vitest';

import { StaticLibraryDataSource } from '@/data/datasources/staticLibraryDataSource';
import type { Library } from '@/domain/models/library';

const SAMPLE: Library[] = [
  {
    systemId: 'Tokyo_Minato',
    systemName: '港区図書館',
    libKey: 'みなと',
    libId: '123',
    shortName: 'みなと図書館',
    formalName: '港区立みなと図書館',
    address: '東京都港区芝公園3-2-25',
    pref: '東京都',
    city: '港区',
    category: 'MEDIUM',
  },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('StaticLibraryDataSource', () => {
  test('都道府県名から静的JSONのURLを組み立てて取得する（日本語はエンコードする）', async () => {
    let calledUrl = '';
    const fetchFn: typeof fetch = async (input) => {
      calledUrl = String(input);
      return jsonResponse(SAMPLE);
    };
    const source = new StaticLibraryDataSource({ fetchFn, baseUrl: '/data/libraries' });

    const result = await source.getByPrefecture('東京都');

    expect(calledUrl).toBe(`/data/libraries/${encodeURIComponent('東京都')}.json`);
    expect(result).toEqual(SAMPLE);
  });

  test('baseUrl 未指定時は既定の /data/libraries を使う', async () => {
    let calledUrl = '';
    const fetchFn: typeof fetch = async (input) => {
      calledUrl = String(input);
      return jsonResponse(SAMPLE);
    };
    const source = new StaticLibraryDataSource({ fetchFn });

    await source.getByPrefecture('大阪府');

    expect(calledUrl).toBe(`/data/libraries/${encodeURIComponent('大阪府')}.json`);
  });

  test('HTTP エラー（404等）は例外を投げる', async () => {
    const fetchFn: typeof fetch = async () => jsonResponse({ error: 'not found' }, 404);
    const source = new StaticLibraryDataSource({ fetchFn });

    await expect(source.getByPrefecture('存在しない県')).rejects.toThrow();
  });
});
