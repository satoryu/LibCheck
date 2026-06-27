/**
 * 共有: Google ID トークン検証・セッション Cookie・認証必須ハンドラ用ヘルパ。
 * `_shared` 配下はルートにならない（Pages はルートにマップしない）。
 *
 * 認証は次の二段（#91）:
 *   1. セッション Cookie（HttpOnly・durable・リロードでも送られる）= 主。
 *   2. Authorization: Bearer（後方互換: dev モック / Google ID トークン）。
 *
 * dev-only mock: `AUTH_MOCK === '1'`（ローカルのみ・本番未設定）のとき、
 * `MOCK_ID_TOKEN`（Bearer）/ `MOCK_SESSION`（Cookie）は `MOCK_USER` を返す。
 */
import { jwtVerify, createRemoteJWKSet, SignJWT } from 'jose';

export const MOCK_ID_TOKEN = 'mock.dev.token';
export const MOCK_SESSION = 'mock.dev.session';
export const MOCK_USER = {
  id: 'mock-user',
  email: 'dev@example.com',
  name: 'Dev User',
};

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

const SESSION_COOKIE = 'session';
/** セッションの既定有効期限（秒）= 7 日。 */
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

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
  return userFromPayload(payload);
}

function userFromPayload(payload) {
  return {
    id: String(payload.sub),
    email: typeof payload.email === 'string' ? payload.email : undefined,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
  };
}

/** セッション JWT を HS256 で署名する（`SESSION_SECRET` 鍵）。 */
export async function signSession(user, secret, maxAgeSec = SESSION_MAX_AGE) {
  const key = new TextEncoder().encode(secret);
  const nowSec = Math.floor(Date.now() / 1000);
  return new SignJWT({
    email: user.email,
    name: user.name,
    picture: user.picture,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + maxAgeSec)
    .sign(key);
}

/** セッション JWT を検証して user を返す。無効/期限切れは throw。 */
export async function verifySession(token, secret) {
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key);
  return userFromPayload(payload);
}

/** Set-Cookie 値（HttpOnly/Secure/SameSite=Strict）。 */
export function sessionSetCookie(value, maxAgeSec = SESSION_MAX_AGE) {
  return `${SESSION_COOKIE}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSec}`;
}

/** セッション Cookie を消す Set-Cookie 値。 */
export function sessionClearCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

/** Cookie ヘッダから指定名の値を取り出す（無ければ null）。 */
export function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
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
 * 認証必須エンドポイント用。セッション Cookie（優先）か Bearer を検証し user を返す。
 * 失敗時は `{ user: null, response }`（401/500）、成功時 `{ user }`。
 */
export async function requireUser(request, env) {
  // 1. セッション Cookie（durable）
  const cookie = readCookie(request, SESSION_COOKIE);
  if (cookie) {
    if (env.AUTH_MOCK === '1' && cookie === MOCK_SESSION) {
      return { user: MOCK_USER };
    }
    if (env.SESSION_SECRET) {
      try {
        return { user: await verifySession(cookie, env.SESSION_SECRET) };
      } catch {
        // 無効/期限切れ Cookie → Bearer もしくは 401 へフォールバック。
      }
    }
  }

  // 2. Authorization: Bearer（後方互換: dev モック / Google ID トークン）
  const token = bearerToken(request);
  if (!token) {
    return { user: null, response: json({ error: 'unauthorized' }, 401) };
  }
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
