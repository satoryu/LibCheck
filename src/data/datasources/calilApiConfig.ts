/**
 * Configuration for the Calil API client.
 * Mirrors the Dart `CalilApiConfig`.
 *
 * SECURITY: The Calil app key is intentionally NOT read on the client.
 * If the key were embedded here (e.g. via a `VITE_`-prefixed env var) Vite would
 * inline it into the production bundle and leak it to every user. Instead the key
 * is injected **server-side**:
 *   - production: the Cloudflare Pages Function (`functions/api/calil/[action].js`)
 *     overrides `appkey` from the `CALIL_APP_KEY` secret. The proxy also requires a
 *     valid Google ID token (Authorization: Bearer) so the key cannot be used by
 *     anonymous third parties (#89).
 *   - local dev: the Vite dev proxy (`vite.config.ts`) injects `appkey` from the
 *     non-`VITE_` `CALIL_APP_KEY` env var (does not go through the Function).
 * The client therefore sends an empty `appkey`, which the proxy replaces, plus the
 * current ID token as a Bearer header (see CalilApiClient).
 *
 * All requests go through the same-origin `/api/calil` path in every environment.
 */
export const CALIL_API_CONFIG = {
  appKey: '',
  baseUrl: import.meta.env.VITE_CALIL_BASE_URL ?? '/api/calil',
  pollingIntervalMs: 2000,
  maxPollingCount: 30,
  httpTimeoutMs: 10000,
} as const;
