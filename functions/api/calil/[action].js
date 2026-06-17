/**
 * Cloudflare Pages Function that proxies the Calil API.
 *
 * Routed at `/api/calil/{action}` (the `[action]` dynamic segment). It injects
 * the secret `appkey` server-side so the key is never shipped to the browser.
 * Port of the former Azure Functions `calilProxy.js` (same behavior).
 *
 * The `CALIL_APP_KEY` secret is provided via:
 *   - production: Cloudflare Pages project → Settings → Variables and Secrets
 *   - local:      .dev.vars → CALIL_APP_KEY (for `wrangler pages dev`)
 */

const CALIL_ORIGIN = 'https://api.calil.jp';

/** Only these upstream actions may be proxied. */
const ALLOWED_ACTIONS = new Set(['library', 'check']);

export async function onRequestGet(context) {
  const { request, env, params } = context;

  const action = params.action;
  if (!ALLOWED_ACTIONS.has(action)) {
    return new Response('Not Found', { status: 404 });
  }

  const appKey = env.CALIL_APP_KEY;
  if (!appKey) {
    return new Response('Server misconfigured: CALIL_APP_KEY is not set', {
      status: 500,
    });
  }

  const requestUrl = new URL(request.url);
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
  return new Response(bodyText, {
    status: upstream.status,
    headers: {
      'content-type':
        upstream.headers.get('content-type') ?? 'application/json',
      // Responses depend on a secret-bearing upstream request; do not cache.
      'cache-control': 'no-store',
    },
  });
}
