// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import { bookOgTitle, fetchBookMeta } from './bookMeta.js';

const ISBN = '9784003101018';

function openBd(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function memoryCache() {
  const store = new Map<string, Response>();
  return {
    store,
    match: vi.fn(async (req: Request) => store.get(req.url)?.clone()),
    put: vi.fn(async (req: Request, res: Response) => {
      store.set(req.url, res);
    }),
  };
}

describe('fetchBookMeta（#159）', () => {
  it('OpenBD から書名と書影（http(s) のみ）を取得する', async () => {
    const fetchFn = vi.fn(async () =>
      openBd([{ summary: { title: '吾輩は猫である', cover: 'https://cover.openbd.jp/9784003101018.jpg' } }]),
    );

    const meta = await fetchBookMeta(ISBN, { fetchFn });

    expect(String(fetchFn.mock.calls[0][0])).toBe(`https://api.openbd.jp/v1/get?isbn=${ISBN}`);
    expect(meta).toEqual({ title: '吾輩は猫である', coverUrl: 'https://cover.openbd.jp/9784003101018.jpg' });
  });

  it('書影が無い・http(s) でない場合は coverUrl を null にする', async () => {
    const meta = await fetchBookMeta(ISBN, {
      fetchFn: async () => openBd([{ summary: { title: 'T', cover: 'javascript:alert(1)' } }]),
    });

    expect(meta).toEqual({ title: 'T', coverUrl: null });
  });

  it.each([
    ['OpenBD に無い（[null]）', async () => openBd([null])],
    ['書名が空', async () => openBd([{ summary: { title: '' } }])],
    ['HTTP エラー', async () => openBd({}, 500)],
    ['JSON でない', async () => new Response('<html>', { status: 200 })],
    ['通信エラー', async () => Promise.reject(new Error('network'))],
  ])('%s は null', async (_label, respond) => {
    expect(await fetchBookMeta(ISBN, { fetchFn: vi.fn(respond) })).toBeNull();
  });

  it('2回目はキャッシュから返し、OpenBD を呼ばない', async () => {
    const cache = memoryCache();
    const pending: Promise<unknown>[] = [];
    const fetchFn = vi.fn(async () => openBd([{ summary: { title: '吾輩は猫である' } }]));
    const deps = { fetchFn, cache, waitUntil: (p: Promise<unknown>) => pending.push(p) };

    await fetchBookMeta(ISBN, deps);
    await Promise.all(pending);
    const second = await fetchBookMeta(ISBN, deps);

    expect(second).toEqual({ title: '吾輩は猫である', coverUrl: null });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('該当なしもキャッシュし、同じ ISBN で OpenBD を何度も呼ばない', async () => {
    const cache = memoryCache();
    const pending: Promise<unknown>[] = [];
    const fetchFn = vi.fn(async () => openBd([null]));
    const deps = { fetchFn, cache, waitUntil: (p: Promise<unknown>) => pending.push(p) };

    await fetchBookMeta(ISBN, deps);
    await Promise.all(pending);

    expect(await fetchBookMeta(ISBN, deps)).toBeNull();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('通信エラーはキャッシュしない（次の問い合わせで取り直す）', async () => {
    const cache = memoryCache();
    await fetchBookMeta(ISBN, { fetchFn: async () => Promise.reject(new Error('network')), cache });

    expect(cache.put).not.toHaveBeenCalled();
  });
});

describe('bookOgTitle', () => {
  it('『書名』が図書館で借りられるか、LibCheckで確認', () => {
    expect(bookOgTitle('吾輩は猫である')).toBe('『吾輩は猫である』が図書館で借りられるか、LibCheckで確認');
  });
});
