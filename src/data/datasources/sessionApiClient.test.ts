import { describe, it, expect, vi } from 'vitest';

import { SessionApiClient } from '@/data/datasources/sessionApiClient';

function jsonRes(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('SessionApiClient', () => {
  it('restore: 200 ならユーザーを返す', async () => {
    const fetchFn = vi.fn(async () =>
      jsonRes({ id: 'u1', name: 'Alice' }),
    ) as unknown as typeof fetch;
    const client = new SessionApiClient(fetchFn);
    expect(await client.restore()).toEqual({ id: 'u1', name: 'Alice' });
  });

  it('restore: 401 なら null', async () => {
    const fetchFn = vi.fn(async () => jsonRes({}, 401)) as unknown as typeof fetch;
    const client = new SessionApiClient(fetchFn);
    expect(await client.restore()).toBeNull();
  });

  it('restore: 例外でも null（投げない）', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('network');
    }) as unknown as typeof fetch;
    const client = new SessionApiClient(fetchFn);
    expect(await client.restore()).toBeNull();
  });

  it('create: /api/session に idToken を POST する', async () => {
    let captured: { url: string; init?: RequestInit } | null = null;
    const fetchFn = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      captured = { url: String(url), init };
      return jsonRes({ id: 'u1' });
    }) as unknown as typeof fetch;
    const client = new SessionApiClient(fetchFn);

    await client.create('idtok');

    expect(captured!.url).toBe('/api/session');
    expect(captured!.init?.method).toBe('POST');
    expect(JSON.parse(String(captured!.init?.body))).toEqual({ idToken: 'idtok' });
  });

  it('destroy: /api/session に DELETE する', async () => {
    let method: string | undefined;
    const fetchFn = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      method = init?.method;
      return jsonRes({ ok: true });
    }) as unknown as typeof fetch;
    const client = new SessionApiClient(fetchFn);

    await client.destroy();
    expect(method).toBe('DELETE');
  });
});
