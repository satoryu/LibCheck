/**
 * Cloudflare Pages Function: `/api/session`（#91 セッション）
 * - POST: GIS の ID トークンを検証し、HttpOnly セッション Cookie を発行（ログイン）。
 * - DELETE: セッション Cookie を削除（ログアウト）。
 *
 * セッション Cookie により、リロード後もメモリのトークン無しでログインを維持する。
 */
import {
  verifyGoogleIdToken,
  signSession,
  sessionSetCookie,
  sessionClearCookie,
  MOCK_ID_TOKEN,
  MOCK_SESSION,
  MOCK_USER,
  SESSION_MAX_AGE,
} from '../_shared/googleAuth.js';

function jsonWithCookie(body, status, setCookie) {
  const headers = {
    'content-type': 'application/json',
    'cache-control': 'no-store',
  };
  if (setCookie) headers['set-cookie'] = setCookie;
  return new Response(JSON.stringify(body), { status, headers });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonWithCookie({ error: 'bad request' }, 400);
  }
  const idToken = typeof body?.idToken === 'string' ? body.idToken : null;
  if (!idToken) return jsonWithCookie({ error: 'bad request' }, 400);

  // dev-only mock
  if (env.AUTH_MOCK === '1' && idToken === MOCK_ID_TOKEN) {
    return jsonWithCookie(
      MOCK_USER,
      200,
      sessionSetCookie(MOCK_SESSION, SESSION_MAX_AGE),
    );
  }

  if (!env.GOOGLE_CLIENT_ID || !env.SESSION_SECRET) {
    return jsonWithCookie({ error: 'server misconfigured' }, 500);
  }

  let user;
  try {
    user = await verifyGoogleIdToken(idToken, env.GOOGLE_CLIENT_ID);
  } catch {
    return jsonWithCookie({ error: 'unauthorized' }, 401);
  }

  const session = await signSession(user, env.SESSION_SECRET, SESSION_MAX_AGE);
  return jsonWithCookie(user, 200, sessionSetCookie(session, SESSION_MAX_AGE));
}

export function onRequestDelete() {
  return jsonWithCookie({ ok: true }, 200, sessionClearCookie());
}
