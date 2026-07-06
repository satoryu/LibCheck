import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initSentry } from "./sentry";

// エラー監視は最初期に初期化する（以降の描画・グローバルエラーを捕捉するため）。
initSentry();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
