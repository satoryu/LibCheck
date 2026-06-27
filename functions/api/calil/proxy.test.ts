// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';

import { onRequestGet } from './[action].js';
import { MOCK_ID_TOKEN } from '../../_shared/googleAuth.js';

const AUTH = { authorization: `Bearer ${MOCK_ID_TOKEN}` };
const ENV = { AUTH_MOCK: '1', CALIL_APP_KEY: 'server-secret-key' };

function ctx(action, headers, env = ENV, query = '?pref=%E6%9D%B1%E4%BA%AC%E9%83%BD&appkey=') {
  return {
    request: new Request(`https://x/api/calil/${action}${query}`, {
      method: 'GET',
      headers,
    }),
    env,
    params: { action },
  };
}

function mockFetch(impl) {
  const fn = vi.fn(impl);
  globalThis.fetch = fn;
  return fn;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('calil proxy: 認証', () => {
  it('トークン無しは 401 で上流を呼ばない', async () => {
    const fetchFn = mockFetch(async () => new Response('[]', { status: 200 }));
    const res = await onRequestGet(ctx('library', {}));
    expect(res.status).toBe(401);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('許可外 action は 404', async () => {
    const res = await onRequestGet(ctx('hack', AUTH));
    expect(res.status).toBe(404);
  });
});

describe('calil proxy: 中継とヘッダ', () => {
  it('library: appkey をサーバ値で注入し、Cache-Control: public を付ける', async () => {
    const fetchFn = mockFetch(async (url) => {
      const u = new URL(String(url));
      expect(u.pathname).toBe('/library');
      expect(u.searchParams.get('appkey')).toBe('server-secret-key');
      return new Response('[]', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const res = await onRequestGet(ctx('library', AUTH));
    expect(res.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledOnce();
    expect(res.headers.get('cache-control')).toMatch(/public/);
  });

  it('check: no-store（キャッシュしない）', async () => {
    mockFetch(async () => new Response('{}', { status: 200 }));
    const res = await onRequestGet(
      ctx('check', AUTH, ENV, '?isbn=9784&systemid=Tokyo_Minato&appkey='),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('CALIL_APP_KEY 未設定は 500', async () => {
    mockFetch(async () => new Response('[]', { status: 200 }));
    const res = await onRequestGet(ctx('library', AUTH, { AUTH_MOCK: '1' }));
    expect(res.status).toBe(500);
  });
});
