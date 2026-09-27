/**
 * Service Worker（PWA, #72）の登録（#176）。
 *
 * - vite-plugin-pwa の自動注入（`injectRegister: 'script'` が生成する
 *   `/registerSW.js`）は `register()` の reject を catch しておらず、SW を拒否・
 *   取得失敗する環境（クローラ、古い iOS 等）で未処理 rejection として Sentry に
 *   送られていた。自動注入をやめ（`injectRegister: false`）、ここで登録する。
 * - 登録の中身は生成スクリプトと同じ（`load` 後に `/sw.js` をスコープ `/` で）。
 *   パスとスコープは vite.config.ts の VitePWA 既定値（filename / scope）と対応。
 * - 失敗時の実害は「その環境でオフライン動作・インストールが効かない」だけのため
 *   Sentry には送らず、調査用にコンソールへ警告のみ出す。
 * - アプリのバンドルから読み込むため CSP（script-src 'self'）にも適合する。
 */

const SW_URL = '/sw.js';
const SW_SCOPE = '/';

/** テストで差し替えるためのグローバル。既定は実ブラウザのもの。 */
export type ServiceWorkerEnv = {
  navigator: Navigator;
  window: Window;
  document: Document;
};

/** アプリ起動時（main.tsx）に一度だけ呼ぶ。 */
export function registerServiceWorker(
  env: ServiceWorkerEnv = { navigator, window, document },
): void {
  if (!('serviceWorker' in env.navigator)) return;

  const register = (): void => {
    env.navigator.serviceWorker
      .register(SW_URL, { scope: SW_SCOPE })
      .catch((error: unknown) => {
        console.warn('[pwa] Service Worker の登録に失敗しました', error);
      });
  };

  // main.tsx は module script のため通常は load 前に実行されるが、順序に依存しない。
  if (env.document.readyState === 'complete') {
    register();
  } else {
    env.window.addEventListener('load', register, { once: true });
  }
}
