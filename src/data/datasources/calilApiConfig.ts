/**
 * Configuration for the Calil API client.
 * Mirrors the Dart `CalilApiConfig`.
 *
 * SECURITY: The Calil app key is intentionally NOT read on the client.
 * If the key were embedded here (e.g. via a `VITE_`-prefixed env var) Vite would
 * inline it into the production bundle and leak it to every user. Instead the key
 * is injected **server-side**:
 *   - production: the Azure Functions proxy (`api/src/functions/calilProxy.js`)
 *     overrides `appkey` from the `CALIL_APP_KEY` application setting when serving
 *     `/api/calil/*` behind Azure Static Web Apps.
 *   - local dev: the Vite dev proxy (`vite.config.ts`) injects `appkey` from the
 *     non-`VITE_` `CALIL_APP_KEY` env var.
 * The client therefore sends an empty `appkey`, which the proxy replaces.
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
