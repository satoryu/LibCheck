/**
 * OpenBD API のクライアント設定。
 *
 * OpenBD（https://openbd.jp/）は日本の書誌・書影を提供する無料 API で、
 * APIキー不要・CORS 開放のためブラウザから直接呼び出せる。よって Calil の
 * ようなサーバープロキシ（Pages Functions）は不要。
 */
export const OPENBD_API_CONFIG = {
  baseUrl: import.meta.env.VITE_OPENBD_BASE_URL ?? 'https://api.openbd.jp/v1',
  httpTimeoutMs: 10000,
} as const;
