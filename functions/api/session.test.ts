// @vitest-environment node
import { describe, it, expect } from 'vitest';

import { onRequestPost, onRequestDelete } from './session.js';
import { MOCK_ID_TOKEN, MOCK_SESSION, MOCK_USER } from '../_shared/googleAuth.js';

function ctx(env, body) {
  const init = { method: 'POST', headers: { 'content-type': 'application/json' } };
  if (body !== undefined) init.body = JSON.stringify(body);
  return { request: new Request('https://x/api/session', init), env };
}

describe('POST /api/session', () => {
  it('モックトークンでセッション Cookie を発行し user を返す', async () => {
    const res = await onRequestPost(ctx({ AUTH_MOCK: '1' }, { idToken: MOCK_ID_TOKEN }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(MOCK_USER);
    const cookie = res.headers.get('set-cookie') ?? '';
    expect(cookie).toContain(`session=${MOCK_SESSION}`);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
  });

  it('body が不正なら 400', async () => {
    const res = await onRequestPost(ctx({ AUTH_MOCK: '1' }, { nope: true }));
    expect(res.status).toBe(400);
  });

  it('非モックで GOOGLE_CLIENT_ID 未設定なら 500', async () => {
    const res = await onRequestPost(ctx({ AUTH_MOCK: '1' }, { idToken: 'real-looking' }));
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/session', () => {
  it('セッション Cookie を削除する', async () => {
    const res = await onRequestDelete({
      request: new Request('https://x/api/session', { method: 'DELETE' }),
      env: {},
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie') ?? '').toMatch(/Max-Age=0/);
  });
});
