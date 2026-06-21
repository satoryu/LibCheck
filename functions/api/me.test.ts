// @vitest-environment node
import { describe, it, expect } from 'vitest';

import { onRequestGet } from './me.js';
import { MOCK_ID_TOKEN, MOCK_USER } from '../_shared/googleAuth.js';

function ctx(headers: Record<string, string>, env: Record<string, string>) {
  return {
    request: new Request('https://x/api/me', { headers }),
    env,
  } as unknown as Parameters<typeof onRequestGet>[0];
}

describe('GET /api/me', () => {
  it('トークンが無ければ 401', async () => {
    const res = await onRequestGet(ctx({}, { GOOGLE_CLIENT_ID: 'cid' }));
    expect(res.status).toBe(401);
  });

  it('AUTH_MOCK 有効＋モックトークンで 200 と MOCK_USER', async () => {
    const res = await onRequestGet(
      ctx({ authorization: `Bearer ${MOCK_ID_TOKEN}` }, { AUTH_MOCK: '1' }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(MOCK_USER);
  });
});
