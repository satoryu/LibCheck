import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initSentry } from "./sentry";
import { initAnalytics } from "./analytics/gtag";
import { registerServiceWorker } from "./pwa/registerServiceWorker";

// エラー監視は最初期に初期化する（以降の描画・グローバルエラーを捕捉するため）。
initSentry();
// アクセス解析（GA4, #169）。測定 ID 未設定（ローカルの既定）なら何もしない。
initAnalytics();
// PWA の Service Worker（#72）。登録失敗は catch して Sentry に送らない（#176）。
// dev では SW を生成しない（vite.config.ts の devOptions.enabled: false）ため、
// 本番ビルド（build / preview / 本番）でのみ登録する。
if (import.meta.env.PROD) {
  registerServiceWorker();
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
