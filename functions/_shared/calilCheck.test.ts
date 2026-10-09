// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import { CalilUpstreamError, checkWithPolling } from './calilCheck.js';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

const BOOK = { '9784000000000': { Shiga_Yasu: { status: 'OK', libkey: { 野洲: '貸出可' } } } };

describe('checkWithPolling', () => {
  it('appkey・isbn・systemid を付けて check を呼び、continue が 0 ならそのまま返す', async () => {
    const fetchFn = vi.fn(async () => json({ session: 's1', continue: 0, books: BOOK }));
    const sleep = vi.fn(async () => {});

    const result = await checkWithPolling({
      fetchFn,
      appKey: 'KEY',
      isbn: '9784000000000',
      systemIds: ['Shiga_Yasu', 'Special_Shiga_Ec'],
      sleep,
    });

    const url = new URL(String(fetchFn.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe('https://api.calil.jp/check');
    expect(url.searchParams.get('appkey')).toBe('KEY');
    expect(url.searchParams.get('isbn')).toBe('9784000000000');
    expect(url.searchParams.get('systemid')).toBe('Shiga_Yasu,Special_Shiga_Ec');
    expect(url.searchParams.get('format')).toBe('json');
    expect(url.searchParams.get('callback')).toBe('no');
    expect(result.complete).toBe(true);
    expect(result.response.books['9784000000000'].Shiga_Yasu.libKeys).toEqual({ 野洲: '貸出可' });
    expect(sleep).not.toHaveBeenCalled();
  });

  it('continue が 1 の間は session で2秒間隔にポーリングする', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(json({ session: 's1', continue: 1, books: {} }))
      .mockResolvedValueOnce(json({ session: 's1', continue: 1, books: {} }))
      .mockResolvedValueOnce(json({ session: 's1', continue: 0, books: BOOK }));
    const sleep = vi.fn(async () => {});

    const result = await checkWithPolling({ fetchFn, appKey: 'KEY', isbn: '9784000000000', systemIds: ['Shiga_Yasu'], sleep });

    expect(fetchFn).toHaveBeenCalledTimes(3);
    const poll = new URL(String(fetchFn.mock.calls[1][0]));
    expect(poll.searchParams.get('session')).toBe('s1');
    expect(poll.searchParams.get('appkey')).toBe('KEY');
    expect(poll.searchParams.has('isbn')).toBe(false);
    expect(sleep).toHaveBeenCalledWith(2000);
    expect(result.complete).toBe(true);
  });

  it('最大回数を超えたら打ち切り、complete: false で途中の結果を返す', async () => {
    const fetchFn = vi.fn(async () => json({ session: 's1', continue: 1, books: BOOK }));

    const result = await checkWithPolling({
      fetchFn,
      appKey: 'KEY',
      isbn: '9784000000000',
      systemIds: ['Shiga_Yasu'],
      sleep: async () => {},
      maxPolls: 3,
    });

    expect(fetchFn).toHaveBeenCalledTimes(1 + 3);
    expect(result.complete).toBe(false);
  });

  it.each([
    ['HTTP エラー', async () => new Response('x', { status: 503 })],
    ['JSON でない', async () => new Response('<html>', { status: 200 })],
    ['通信エラー', async () => Promise.reject(new Error('network'))],
  ])('%s は CalilUpstreamError', async (_label, respond) => {
    await expect(
      checkWithPolling({ fetchFn: vi.fn(respond), appKey: 'KEY', isbn: '9784000000000', systemIds: ['A'], sleep: async () => {} }),
    ).rejects.toBeInstanceOf(CalilUpstreamError);
  });
});
