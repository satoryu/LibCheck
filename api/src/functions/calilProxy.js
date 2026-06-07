const { app } = require('@azure/functions');

/**
 * Azure Functions HTTP trigger that proxies the Calil API.
 *
 * Mounted by Azure Static Web Apps at `/api/calil/{action}` (SWA prefixes every
 * function route with `/api`). It injects the secret `appkey` server-side so the
 * key is never shipped to the browser.
 *
 * The `CALIL_APP_KEY` secret is provided via:
 *   - production: SWA → Configuration → Application settings → CALIL_APP_KEY
 *   - local:      api/local.settings.json → Values.CALIL_APP_KEY
 */

const CALIL_ORIGIN = 'https://api.calil.jp';

/** Only these upstream actions may be proxied. */
const ALLOWED_ACTIONS = new Set(['library', 'check']);

app.http('calilProxy', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'calil/{action}',
  handler: async (request, context) => {
    const action = request.params.action;
    if (!ALLOWED_ACTIONS.has(action)) {
      return { status: 404, body: 'Not Found' };
    }

    const appKey = process.env.CALIL_APP_KEY;
    if (!appKey) {
      context.error('CALIL_APP_KEY application setting is not configured');
      return {
        status: 500,
        body: 'Server misconfigured: CALIL_APP_KEY is not set',
      };
    }

    const target = new URL(`${CALIL_ORIGIN}/${action}`);
    // Forward the client's query params...
    for (const [key, value] of request.query) {
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
    } catch (e) {
      context.error('Upstream Calil request failed', e);
      return { status: 502, body: 'Bad Gateway' };
    }

    const bodyText = await upstream.text();
    return {
      status: upstream.status,
      headers: {
        'content-type':
          upstream.headers.get('content-type') ?? 'application/json',
        // Responses depend on a secret-bearing upstream request; do not cache.
        'cache-control': 'no-store',
      },
      body: bodyText,
    };
  },
});
