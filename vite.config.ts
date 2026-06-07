import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  // Load ALL env vars (empty prefix), including the non-`VITE_` CALIL_APP_KEY.
  // Because it has no `VITE_` prefix it is used only here (server-side, dev proxy)
  // and is never exposed to client code / the bundle.
  const env = loadEnv(mode, process.cwd(), "");
  const calilAppKey = env.CALIL_APP_KEY ?? "";

  return {
    plugins: [react()],
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
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
    },
  };
});
