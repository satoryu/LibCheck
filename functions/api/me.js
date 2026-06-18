/**
 * Cloudflare Pages Function: `GET /api/me`
 *
 * Validates a Google ID token (JWT) sent as `Authorization: Bearer <token>` and
 * returns the authenticated user. Used to confirm identity server-side; the
 * persistence APIs (#74) will reuse `verifyGoogleIdToken`.
 *
 * dev-only mock: when `AUTH_MOCK === '1'` (set only in local .dev.vars, never in
 * the production Pages env) a request bearing `MOCK_ID_TOKEN` returns MOCK_USER
 * without contacting Google.
 */
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Shared dev-mock constants. Must match the client side (src/data/datasources/authConfig.ts).
export const MOCK_ID_TOKEN = 'mock.dev.token';
export const MOCK_USER = { id: 'mock-user', email: 'dev@example.com', name: 'Dev User' };

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

let cachedJwks;
function defaultJwks() {
  if (!cachedJwks) cachedJwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));
  return cachedJwks;
}

/**
 * Verify a Google ID token and return the user. Throws if invalid.
 * `opts.jwks` (a key or JWKS resolver) is injectable for tests.
 */
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

function bearerToken(request) {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer (.+)$/.exec(header);
  return match ? match[1] : null;
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const token = bearerToken(request);
  if (!token) return json({ error: 'unauthorized' }, 401);

  // dev-only mock (never enabled in production: AUTH_MOCK is not set there)
  if (env.AUTH_MOCK === '1' && token === MOCK_ID_TOKEN) {
    return json(MOCK_USER, 200);
  }

  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) return json({ error: 'server misconfigured' }, 500);

  try {
    const user = await verifyGoogleIdToken(token, clientId);
    return json(user, 200);
  } catch {
    return json({ error: 'unauthorized' }, 401);
  }
}
