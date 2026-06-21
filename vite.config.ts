import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * dev サーバ専用: 保護 API（登録図書館・検索履歴）をメモリ実装で代替する。
 * 本番では Cloudflare Pages Functions + D1 が担うが、`npm run dev`（Vite）は
 * Functions を起動しないため、認証モックでローカル開発を成立させる目的で用意する。
 * 認証は dev のため Authorization ヘッダの有無のみ確認（再起動で消える）。
 */
function devPersistenceApiPlugin(): Plugin {
  let registeredLibraries: unknown[] = [];
  let searchHistory: unknown[] = [];

  const readJson = (req: IncomingMessage): Promise<Record<string, unknown>> =>
    new Promise((resolve) => {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => {
        try {
          resolve(JSON.parse(data || "{}"));
        } catch {
          resolve({});
        }
      });
    });

  const handler =
    (kind: "libraries" | "entries") =>
    async (req: IncomingMessage, res: ServerResponse) => {
      if (!req.headers.authorization) {
        res.statusCode = 401;
        res.end("unauthorized");
        return;
      }
      res.setHeader("content-type", "application/json");
      res.setHeader("cache-control", "no-store");
      const payload = () =>
        kind === "libraries"
          ? { libraries: registeredLibraries }
          : { entries: searchHistory };
      if (req.method === "GET") {
        res.end(JSON.stringify(payload()));
        return;
      }
      if (req.method === "PUT") {
        const body = await readJson(req);
        if (kind === "libraries") {
          registeredLibraries = Array.isArray(body.libraries) ? body.libraries : [];
        } else {
          searchHistory = Array.isArray(body.entries) ? body.entries : [];
        }
        res.end(JSON.stringify(payload()));
        return;
      }
      res.statusCode = 405;
      res.end();
    };

  return {
    name: "dev-persistence-api",
    configureServer(server) {
      server.middlewares.use("/api/registered-libraries", handler("libraries"));
      server.middlewares.use("/api/search-history", handler("entries"));
    },
  };
}

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

  return {
    plugins: [react(), devPersistenceApiPlugin()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      proxy: {
        // Mirrors the production Azure Functions proxy: strips the /api/calil
        // prefix and injects the secret appkey server-side before forwarding.
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
