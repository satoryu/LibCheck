/**
 * Cloudflare Pages Function that proxies the Calil API.
 *
 * Routed at `/api/calil/{action}` (the `[action]` dynamic segment). It injects
 * the secret `appkey` server-side so the key is never shipped to the browser.
 *
 * 濫用対策（#89, M-1）:
 *  - 認証必須（requireUser）。匿名・偽トークンは 401 で弾き、上流（=キー使用）に
 *    中継しない。これにより見知らぬ第三者があなたの appkey を使い回せない。
 *  - `library`（地域の図書館一覧・準静的）はエッジキャッシュし、上流呼び出し
 *    （クォータ消費）を削減。`check`（リアルタイム在庫）は no-store。
 *
 * The `CALIL_APP_KEY` secret is provided via:
 *   - production: Cloudflare Pages project → Settings → Variables and Secrets
 *   - local:      .dev.vars → CALIL_APP_KEY（ただしローカル /api/calil は Vite の
 *                 dev proxy 経由で、この Function は通らない）
 */
import { requireUser } from '../../_shared/googleAuth.js';

const CALIL_ORIGIN = 'https://api.calil.jp';

/** Only these upstream actions may be proxied. */
const ALLOWED_ACTIONS = new Set(['library', 'check']);

/** library（準静的）のエッジキャッシュ TTL（秒）。 */
const LIBRARY_CACHE_TTL = 86400; // 1 日

export async function onRequestGet(context) {
  const { request, env, params } = context;

  const action = params.action;
  if (!ALLOWED_ACTIONS.has(action)) {
    return new Response('Not Found', { status: 404 });
  }

  // 認証必須: 上流（=appkey 使用）に到達する前に弾く。
  const { user, response: authResponse } = await requireUser(request, env);
  if (!user) return authResponse;

  const appKey = env.CALIL_APP_KEY;
  if (!appKey) {
    return new Response('Server misconfigured: CALIL_APP_KEY is not set', {
      status: 500,
    });
  }

  const requestUrl = new URL(request.url);

  // library のみキャッシュ対象。Cache API はランタイム機能（テスト等で不在なら
  // undefined となりキャッシュ経路はスキップされる）。
  const cacheable = action === 'library';
  const cache = cacheable ? globalThis.caches?.default : undefined;
  let cacheKey;
  if (cache) {
    // クライアントは空 appkey を送る。揺れを避けるため appkey を除いた正規 URL を鍵に。
    const keyUrl = new URL(requestUrl.toString());
    keyUrl.searchParams.delete('appkey');
    cacheKey = new Request(keyUrl.toString(), { method: 'GET' });
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }

  const target = new URL(`${CALIL_ORIGIN}/${action}`);
  // Forward the client's query params...
  for (const [key, value] of requestUrl.searchParams) {
    target.searchParams.set(key, value);
  }
  // ...but ALWAYS override appkey with the server-side secret (the client sends
  // an empty appkey by design).
  target.searchParams.set('appkey', appKey);

  let upstream;
  try {
    upstream = await fetch(target.toString(), {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
  } catch {
    return new Response('Bad Gateway', { status: 502 });
  }

  const bodyText = await upstream.text();
  const result = new Response(bodyText, {
    status: upstream.status,
    headers: {
      'content-type':
        upstream.headers.get('content-type') ?? 'application/json',
      // library 成功時のみキャッシュ可。それ以外（check・エラー）は秘密注入の
      // 上流に依存するためキャッシュしない。
      'cache-control':
        cacheable && upstream.status === 200
          ? `public, max-age=${LIBRARY_CACHE_TTL}`
          : 'no-store',
    },
  });

  if (cache && upstream.status === 200) {
    context.waitUntil?.(cache.put(cacheKey, result.clone()));
  }
  return result;
}
