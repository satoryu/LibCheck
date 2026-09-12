/**
 * Google Analytics 4（gtag.js）の初期化とイベント送信（#169）。
 *
 * - 測定 ID は公開値。ビルド時に `VITE_GA_MEASUREMENT_ID`（GitHub Actions の
 *   リポジトリ変数 `GA_MEASUREMENT_ID`）から注入され、未設定（ローカルの既定）
 *   なら初期化せず、GA4 へ一切送信しない。
 * - CSP（public/_headers）は `script-src 'unsafe-inline'` を許可していないため、
 *   Google 公式のインラインスニペットは使えない。代わりにこのモジュールから
 *   gtag.js を動的に読み込む（外部 src はホスト許可で通る）。PWA の registerSW
 *   と同じ方針。
 * - SPA のページビューは GA4 の拡張計測（history イベント）に任せ、手動送信は
 *   しない（手動で足すと二重計上になる）。
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** GA4 のイベントパラメータ。高カーディナリティな値は送らない方針（#169）。 */
export type AnalyticsParams = Record<string, string | number | boolean>;

const GTAG_SCRIPT_BASE = 'https://www.googletagmanager.com/gtag/js?id=';

let initialized = false;

function measurementId(): string {
  return (import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim();
}

/**
 * GA4 を初期化する。測定 ID 未設定・初期化済みのときは何もしない。
 * アプリ起動時（main.tsx）に一度だけ呼ぶ。
 */
export function initAnalytics(): void {
  if (initialized) return;
  const id = measurementId();
  if (id.length === 0) return;
  initialized = true;

  const dataLayer = window.dataLayer ?? [];
  window.dataLayer = dataLayer;
  // 公式スニペットと同じく `arguments` オブジェクトを push する（gtag.js が
  // この形を前提に読み出すため、配列に置き換えない）。
  function gtag(..._args: unknown[]): void {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  if (import.meta.env.DEV) {
    // DebugView で確認できるようにする。本番では付けない（レポートへの影響と
    // 不要なパラメータを避けるため）。
    gtag('config', id, { debug_mode: true });
  } else {
    gtag('config', id);
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `${GTAG_SCRIPT_BASE}${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

/**
 * イベントを送信する。未初期化（測定 ID 未設定・広告ブロック等）なら no-op。
 * 計測は best-effort であり、失敗してもアプリの動作に影響させない。
 *
 * ローカル開発（`npm run dev`）では、測定 ID の有無にかかわらずコンソールに
 * 出力して発火を確認できるようにする。
 */
export function trackEvent(name: string, params?: AnalyticsParams): void {
  if (import.meta.env.MODE === 'development') {
    console.info('[analytics]', name, params);
  }
  if (params === undefined) {
    window.gtag?.('event', name);
    return;
  }
  window.gtag?.('event', name, params);
}
