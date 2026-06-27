// @vitest-environment node
import { describe, it, expect } from 'vitest';

import {
  signSession,
  verifySession,
  sessionSetCookie,
  sessionClearCookie,
  readCookie,
  requireUser,
  MOCK_SESSION,
} from './googleAuth.js';

const SECRET = 'test-session-secret-xxxxxxxxxxxxxxxx';
const user = { id: 'u1', email: 'a@example.com', name: 'Alice' };

describe('signSession / verifySession', () => {
  it('署名→検証でユーザーを復元する', async () => {
    const token = await signSession(user, SECRET, 3600);
    const got = await verifySession(token, SECRET);
    expect(got.id).toBe('u1');
    expect(got.email).toBe('a@example.com');
    expect(got.name).toBe('Alice');
  });

  it('別シークレットでは検証に失敗する', async () => {
    const token = await signSession(user, SECRET, 3600);
    await expect(verifySession(token, 'other-secret-yyyyyyyyyyyyy')).rejects.toThrow();
  });
});

describe('cookie ヘルパ', () => {
  it('set は HttpOnly/Secure/SameSite=Strict/Path を含む', () => {
    const c = sessionSetCookie('abc', 3600);
    expect(c).toMatch(/^session=abc;/);
    expect(c).toMatch(/HttpOnly/);
    expect(c).toMatch(/Secure/);
    expect(c).toMatch(/SameSite=Strict/);
    expect(c).toMatch(/Path=\//);
    expect(c).toMatch(/Max-Age=3600/);
  });
  it('clear は Max-Age=0', () => {
    expect(sessionClearCookie()).toMatch(/Max-Age=0/);
  });
  it('readCookie は指定名の値を返す', () => {
    const req = new Request('https://x/', {
      headers: { cookie: 'a=1; session=tok123; b=2' },
    });
    expect(readCookie(req, 'session')).toBe('tok123');
    expect(readCookie(req, 'missing')).toBeNull();
  });
});

describe('requireUser: cookie 対応', () => {
  it('有効なセッション Cookie でユーザーを返す', async () => {
    const token = await signSession(user, SECRET, 3600);
    const req = new Request('https://x/api/me', {
      headers: { cookie: `session=${token}` },
    });
    const { user: got, response } = await requireUser(req, { SESSION_SECRET: SECRET });
    expect(response).toBeUndefined();
    expect(got.id).toBe('u1');
  });

  it('Cookie 無し・Bearer 無しは 401', async () => {
    const req = new Request('https://x/api/me');
    const { user: got, response } = await requireUser(req, { SESSION_SECRET: SECRET });
    expect(got).toBeNull();
    expect(response.status).toBe(401);
  });

  it('AUTH_MOCK + モックセッション Cookie で MOCK_USER', async () => {
    const req = new Request('https://x/api/me', {
      headers: { cookie: `session=${MOCK_SESSION}` },
    });
    const { user: got } = await requireUser(req, { AUTH_MOCK: '1' });
    expect(got.id).toBe('mock-user');
  });
});
