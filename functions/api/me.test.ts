// @vitest-environment node
// 本ファイルはサーバー（Workers/Node）コードのため node 環境で実行する。
// jsdom 環境だと jose の Uint8Array が realm 跨ぎで instanceof に失敗する。
import { describe, it, expect } from 'vitest';
import { SignJWT, generateKeyPair } from 'jose';

import {
  verifyGoogleIdToken,
  onRequestGet,
  MOCK_ID_TOKEN,
  MOCK_USER,
} from './me.js';

const CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

async function makeKeys() {
  // extractable keys so jose can use them across the test
  return generateKeyPair('RS256', { extractable: true });
}

function signer(privateKey: CryptoKey) {
  return (claims: Record<string, unknown> = {}, overrides: Record<string, unknown> = {}) => {
    let jwt = new SignJWT({ email: 'a@example.com', name: 'Alice', ...claims })
      .setProtectedHeader({ alg: 'RS256' })
      .setSubject(String(overrides.sub ?? 'google-sub-123'))
      .setIssuer(String(overrides.iss ?? 'https://accounts.google.com'))
      .setAudience(String(overrides.aud ?? CLIENT_ID))
      .setIssuedAt();
    jwt = jwt.setExpirationTime(String(overrides.exp ?? '1h'));
    return jwt.sign(privateKey);
  };
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
    const token = await signer(privateKey)({}, { aud: 'someone-else' });

    await expect(
      verifyGoogleIdToken(token, CLIENT_ID, { jwks: publicKey }),
    ).rejects.toThrow();
  });

  it('期限切れトークンを拒否する', async () => {
    const { publicKey, privateKey } = await makeKeys();
    const token = await signer(privateKey)({}, { exp: '-1h' });

    await expect(
      verifyGoogleIdToken(token, CLIENT_ID, { jwks: publicKey }),
    ).rejects.toThrow();
  });

  it('署名が不正なトークンを拒否する', async () => {
    const signing = await makeKeys();
    const other = await makeKeys();
    const token = await signer(signing.privateKey)();

    await expect(
      verifyGoogleIdToken(token, CLIENT_ID, { jwks: other.publicKey }),
    ).rejects.toThrow();
  });
});

function ctx(headers: Record<string, string>, env: Record<string, string>) {
  return {
    request: new Request('https://x/api/me', { headers }),
    env,
  } as unknown as Parameters<typeof onRequestGet>[0];
}

describe('GET /api/me (onRequestGet)', () => {
  it('トークンが無ければ 401', async () => {
    const res = await onRequestGet(ctx({}, { GOOGLE_CLIENT_ID: CLIENT_ID }));
    expect(res.status).toBe(401);
  });

  it('AUTH_MOCK 有効＋モックトークンで 200 と MOCK_USER', async () => {
    const res = await onRequestGet(
      ctx({ authorization: `Bearer ${MOCK_ID_TOKEN}` }, { AUTH_MOCK: '1' }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(MOCK_USER);
  });

  it('AUTH_MOCK 無効ならモックトークンでも通常検証に回る（GOOGLE_CLIENT_ID 未設定で 500）', async () => {
    const res = await onRequestGet(
      ctx({ authorization: `Bearer ${MOCK_ID_TOKEN}` }, {}),
    );
    expect(res.status).toBe(500);
  });
});
