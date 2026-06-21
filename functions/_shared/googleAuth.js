/**
 * 共有: Google ID トークン検証と認証必須ハンドラ用ヘルパ。
 * `_shared` 配下はルートにならない（Pages はルートにマップしない）。
 *
 * dev-only mock: `AUTH_MOCK === '1'`（ローカル .dev.vars のみ・本番未設定）の
 * とき `MOCK_ID_TOKEN` は `MOCK_USER` を返す。
 */
import { jwtVerify, createRemoteJWKSet } from 'jose';

export const MOCK_ID_TOKEN = 'mock.dev.token';
export const MOCK_USER = {
  id: 'mock-user',
  email: 'dev@example.com',
  name: 'Dev User',
};

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

let cachedJwks;
function defaultJwks() {
  if (!cachedJwks) cachedJwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));
  return cachedJwks;
}

/** Google ID トークンを検証して user を返す。無効なら throw。`opts.jwks` 注入可（テスト用）。 */
export async function verifyGoogleIdToken(token, clientId, opts = {}) {
  const keys = opts.jwks ?? defaultJwks();
  const { payload } = await jwtVerify(token, keys, {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
  });
  return {
    id: String(payload.sub),
    email: typeof payload.email === 'string' ? payload.email : undefined,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
  };
}

export function bearerToken(request) {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer (.+)$/.exec(header);
  return match ? match[1] : null;
}

export function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/**
 * 認証必須エンドポイント用。Bearer を検証し user を返す。
 * 失敗時は `{ user: null, response }`（401/500）、成功時 `{ user }`。
 */
export async function requireUser(request, env) {
  const token = bearerToken(request);
  if (!token) {
    return { user: null, response: json({ error: 'unauthorized' }, 401) };
  }
  // dev-only mock（本番 env に AUTH_MOCK は無いので無効）
  if (env.AUTH_MOCK === '1' && token === MOCK_ID_TOKEN) {
    return { user: MOCK_USER };
  }
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return {
      user: null,
      response: json({ error: 'server misconfigured' }, 500),
    };
  }
  try {
    const user = await verifyGoogleIdToken(token, clientId);
    return { user };
  } catch {
    return { user: null, response: json({ error: 'unauthorized' }, 401) };
  }
}
