import { describe, expect, test } from 'vitest';

import { OpenBdApiClient } from '@/data/datasources/openBdApiClient';
import { BookMetadataRepositoryImpl } from '@/data/repositories/bookMetadataRepositoryImpl';

function clientReturning(body: unknown): OpenBdApiClient {
  return new OpenBdApiClient({
    fetchFn: async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  });
}

describe('BookMetadataRepositoryImpl', () => {
  test('OpenBD の summary を BookMetadata にマップする', async () => {
    const repo = new BookMetadataRepositoryImpl(
      clientReturning([
        {
          summary: {
            isbn: '9784873117584',
            title: 'リーダブルコード',
            author: 'Dustin Boswell',
            publisher: 'オライリー・ジャパン',
            cover: 'https://cover.openbd.jp/9784873117584.jpg',
          },
        },
      ]),
    );

    const result = await repo.getByIsbn('9784873117584');

    expect(result).toEqual({
      isbn: '9784873117584',
      title: 'リーダブルコード',
      author: 'Dustin Boswell',
      publisher: 'オライリー・ジャパン',
      coverImageUrl: 'https://cover.openbd.jp/9784873117584.jpg',
    });
  });

  test('該当が無ければ null を返す', async () => {
    const repo = new BookMetadataRepositoryImpl(clientReturning([null]));

    expect(await repo.getByIsbn('9780000000000')).toBeNull();
  });

  test('summary が無いレスポンスでも isbn のみの BookMetadata を返す', async () => {
    const repo = new BookMetadataRepositoryImpl(clientReturning([{ onix: {} }]));

    expect(await repo.getByIsbn('9784873117584')).toEqual({
      isbn: '9784873117584',
    });
  });
});
