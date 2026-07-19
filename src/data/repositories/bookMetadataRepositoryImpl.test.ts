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

describe('BookMetadataRepositoryImpl.getByIsbns（#141）', () => {
  it('一括取得を Map に変換し、該当なし(null)は含めない', async () => {
    const fakeClient = {
      async getByIsbns(isbns: string[]) {
        expect(isbns).toEqual(['A', 'B', 'C']);
        return [
          { summary: { isbn: 'A', title: 'タイトルA', cover: 'https://cover.openbd.jp/A.jpg' } },
          null,
          { summary: { isbn: 'C', title: 'タイトルC' } },
        ];
      },
    };
    const repo = new BookMetadataRepositoryImpl(fakeClient as never);

    const map = await repo.getByIsbns(['A', 'B', 'C']);

    expect(map.size).toBe(2);
    expect(map.get('A')?.title).toBe('タイトルA');
    expect(map.get('A')?.coverImageUrl).toBe('https://cover.openbd.jp/A.jpg');
    expect(map.has('B')).toBe(false);
    expect(map.get('C')?.title).toBe('タイトルC');
  });
});
