import { describe, expect, test, vi } from 'vitest';

import { OpenBdApiClient } from '@/data/datasources/openBdApiClient';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('OpenBdApiClient', () => {
  test('ISBN を /get?isbn= で問い合わせ、先頭要素を返す', async () => {
    let calledUrl = '';
    const fetchFn: typeof fetch = async (input) => {
      calledUrl = String(input);
      return jsonResponse([
        {
          summary: {
            isbn: '9784873117584',
            title: 'リーダブルコード',
            author: 'Dustin Boswell',
            publisher: 'オライリー・ジャパン',
            cover: 'https://cover.openbd.jp/9784873117584.jpg',
          },
        },
      ]);
    };
    const client = new OpenBdApiClient({ fetchFn, baseUrl: 'https://api.openbd.jp/v1' });

    const result = await client.getByIsbn('9784873117584');

    expect(calledUrl).toBe('https://api.openbd.jp/v1/get?isbn=9784873117584');
    expect(result?.summary?.title).toBe('リーダブルコード');
    expect(result?.summary?.cover).toBe(
      'https://cover.openbd.jp/9784873117584.jpg',
    );
  });

  test('該当が無い ISBN（[null]）は null を返す', async () => {
    const fetchFn = vi.fn(async () => jsonResponse([null]));
    const client = new OpenBdApiClient({ fetchFn });

    expect(await client.getByIsbn('9780000000000')).toBeNull();
  });

  test('空配列は null を返す', async () => {
    const fetchFn = vi.fn(async () => jsonResponse([]));
    const client = new OpenBdApiClient({ fetchFn });

    expect(await client.getByIsbn('9780000000000')).toBeNull();
  });

  test('非200レスポンスは例外を投げる', async () => {
    const fetchFn = vi.fn(
      async () => new Response('error', { status: 500 }),
    );
    const client = new OpenBdApiClient({ fetchFn });

    await expect(client.getByIsbn('9784873117584')).rejects.toThrow();
  });
});
