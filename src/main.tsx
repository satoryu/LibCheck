import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initSentry } from "./sentry";
import { initAnalytics } from "./analytics/gtag";

// エラー監視は最初期に初期化する（以降の描画・グローバルエラーを捕捉するため）。
initSentry();
// アクセス解析（GA4, #169）。測定 ID 未設定（ローカルの既定）なら何もしない。
initAnalytics();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
