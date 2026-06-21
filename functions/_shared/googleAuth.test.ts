// @vitest-environment node
// サーバー（Workers/Node）コードのため node 環境で実行（jose の Uint8Array realm 対策）。
import { describe, it, expect } from 'vitest';
import { SignJWT, generateKeyPair } from 'jose';

import {
  verifyGoogleIdToken,
  requireUser,
  MOCK_ID_TOKEN,
  MOCK_USER,
} from './googleAuth.js';

const CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

async function makeKeys() {
  return generateKeyPair('RS256', { extractable: true });
}

function signer(privateKey: CryptoKey) {
  return (claims: Record<string, unknown> = {}, overrides: Record<string, unknown> = {}) =>
    new SignJWT({ email: 'a@example.com', name: 'Alice', ...claims })
      .setProtectedHeader({ alg: 'RS256' })
      .setSubject(String(overrides.sub ?? 'google-sub-123'))
      .setIssuer(String(overrides.iss ?? 'https://accounts.google.com'))
      .setAudience(String(overrides.aud ?? CLIENT_ID))
      .setIssuedAt()
      .setExpirationTime(String(overrides.exp ?? '1h'))
      .sign(privateKey);
}

describe('verifyGoogleIdToken', () => {
  it('有効なトークンを検証して user を返す', async () => {
    const { publicKey, privateKey } = await makeKeys();
    const token = await signer(privateKey)({ picture: 'https://x/p.png' });
    const user = await verifyGoogleIdToken(token, CLIENT_ID, { jwks: publicKey });
    expect(user).toEqual({
      id: 'google-sub-123',
      email: 'a@example.com',
      name: 'Alice',
      picture: 'https://x/p.png',
    });
  });

  it('aud が一致しないトークンを拒否する', async () => {
    const { publicKey, privateKey } = await makeKeys();
    const token = await signer(privateKey)({}, { aud: 'other' });
    await expect(verifyGoogleIdToken(token, CLIENT_ID, { jwks: publicKey })).rejects.toThrow();
  });

  it('期限切れトークンを拒否する', async () => {
    const { publicKey, privateKey } = await makeKeys();
    const token = await signer(privateKey)({}, { exp: '-1h' });
    await expect(verifyGoogleIdToken(token, CLIENT_ID, { jwks: publicKey })).rejects.toThrow();
  });

  it('署名が不正なトークンを拒否する', async () => {
    const signing = await makeKeys();
    const other = await makeKeys();
    const token = await signer(signing.privateKey)();
    await expect(verifyGoogleIdToken(token, CLIENT_ID, { jwks: other.publicKey })).rejects.toThrow();
  });
});

function req(headers: Record<string, string>) {
  return new Request('https://x/api/protected', { headers });
}

describe('requireUser', () => {
  it('トークンが無ければ 401 response', async () => {
    const { user, response } = await requireUser(req({}), { GOOGLE_CLIENT_ID: CLIENT_ID });
    expect(user).toBeNull();
    expect(response?.status).toBe(401);
  });

  it('AUTH_MOCK 有効＋モックトークンで MOCK_USER を返す', async () => {
    const { user, response } = await requireUser(
      req({ authorization: `Bearer ${MOCK_ID_TOKEN}` }),
      { AUTH_MOCK: '1' },
    );
    expect(user).toEqual(MOCK_USER);
    expect(response).toBeUndefined();
  });

  it('GOOGLE_CLIENT_ID 未設定なら 500', async () => {
    const { user, response } = await requireUser(
      req({ authorization: 'Bearer something' }),
      {},
    );
    expect(user).toBeNull();
    expect(response?.status).toBe(500);
  });
});
