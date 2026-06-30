import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";
import { devPersistencePlugin } from "./vite-dev-persistence";

export default defineConfig(({ mode }) => {
  // Load ALL env vars (empty prefix), including the non-`VITE_` CALIL_APP_KEY.
  // Because it has no `VITE_` prefix it is used only here (server-side, dev proxy)
  // and is never exposed to client code / the bundle.
  const env = loadEnv(mode, process.cwd(), "");
  const calilAppKey = env.CALIL_APP_KEY ?? "";

  // `--no-experimental-webstorage` only exists on Node 22+. On Node 22/24/25/26 a
  // native (but non-functional) `localStorage` shadows jsdom's Storage and breaks
  // tests, so we disable it. On Node 20 the flag does not exist and passing it
  // crashes the test worker ("bad option"), so omit it there.
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const testExecArgv = nodeMajor >= 22 ? ["--no-experimental-webstorage"] : [];

  // PWA（#72）: インストール可能＋高速化に限定。静的アセットのみ precache し、
  // /api/* と Calil プロキシは SW でキャッシュしない（個人データ残存・古データ表示の回避）。
  // 登録は外部 registerSW.js（injectRegister: 'script'）で CSP（script-src 'self'）に適合。
  // vitest 実行時はビルドに関係しないため無効化する。
  const isTest = process.env.VITEST === "true";
  const pwaPlugins = isTest
    ? []
    : [
        VitePWA({
          registerType: "autoUpdate",
          injectRegister: "script",
          // dev では SW を動かさない（キャッシュ起因の混乱回避）。検証は build/preview か本番で。
          devOptions: { enabled: false },
          includeAssets: [
            "favicon-32x32.png",
            "apple-touch-icon.png",
          ],
          workbox: {
            globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2}"],
            // SPA ナビゲーションのフォールバックから API と法務ページ(.html)を除外。
            navigateFallback: "/index.html",
            navigateFallbackDenylist: [/^\/api\//, /\.html$/],
            // ランタイムキャッシュは定義しない＝ /api 等は常にネットワーク。
            cleanupOutdatedCaches: true,
          },
          manifest: {
            name: "LibCheck — 図書館の蔵書をかんたん検索",
            short_name: "LibCheck",
            description:
              "ISBN から、登録した複数の図書館の蔵書と貸出状況を一度に確認できます。",
            lang: "ja",
            start_url: "/",
            scope: "/",
            display: "standalone",
            theme_color: "#00796B",
            background_color: "#0E3B36",
            icons: [
              { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
              { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
              {
                src: "/maskable-icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
              },
            ],
          },
        }),
      ];

  return {
    plugins: [react(), ...pwaPlugins, devPersistencePlugin()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      proxy: {
        // Mirrors the production Cloudflare Pages Function proxy: strips the
        // /api/calil prefix and injects the secret appkey server-side before
        // forwarding (the Function also requires auth; the dev proxy does not).
        "/api/calil": {
          target: "https://api.calil.jp",
          changeOrigin: true,
          rewrite: (path) => {
            const u = new URL(path, "https://api.calil.jp");
            const stripped = u.pathname.replace(/^\/api\/calil/, "");
            u.searchParams.set("appkey", calilAppKey);
            return `${stripped}?${u.searchParams.toString()}`;
          },
        },
      },
    },
    // Vitest configuration (read at runtime by vitest; not part of vite's UserConfig type).
    test: {
      globals: true,
      // 認証関連の env をテストでは明示的に空にする（ローカルの .env.local の
      // VITE_GOOGLE_CLIENT_ID 等がテストへ漏れて AuthButton が GoogleLogin を
      // 描画し GoogleOAuthProvider 不在でクラッシュするのを防ぐ）。
      env: {
        VITE_GOOGLE_CLIENT_ID: '',
        VITE_AUTH_MOCK: '',
      },
      // Custom env = jsdom + native AbortController restored (see custom-env.ts);
      // required because Node 25's undici Request rejects jsdom's AbortSignal.
      environment: "./src/test/custom-env.ts",
      setupFiles: "./src/test/setup.ts",
      poolOptions: {
        // See `testExecArgv` above: disables Node 22+'s native localStorage so
        // vitest installs jsdom's working Storage; empty on Node 20.
        forks: {
          execArgv: testExecArgv,
        },
      },
    },
  };
});
