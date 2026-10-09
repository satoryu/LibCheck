import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

import { orderedMigrationStatements } from "./vite-dev-migrations";

/**
 * dev サーバ専用: 本番と同じ Pages Functions（登録図書館・検索履歴）を、
 * ローカル SQLite（node:sqlite）を D1 互換アダプタで包んで実行する。
 *
 * これにより `npm run dev` でも「実コード + 実 SQL」を通すため、本番(D1=SQLite)
 * との乖離を最小化できる。node:sqlite は実験的のため、dev スクリプトで
 * NODE_OPTIONS=--experimental-sqlite を付与する。configureServer 内で動的 import
 * するので、build / vitest（configureServer 不実行）ではフラグ不要。
 *
 * 認証は dev のため AUTH_MOCK=1（モックトークンを受理）で動かす。
 *
 * #183: ログインなしの体験版（/api/trial/check）も同じ仕組みで動かす。体験版は
 * 上限の判定に batch の結果（RETURNING）を使い、静的な図書館データを env.ASSETS
 * で読み、src/ の TS を import するため、アダプタは batch の結果を返し、ASSETS は
 * public/ から配信し、関数は Vite の ssrLoadModule で読み込む（素の import() では
 * Node 22 が TS を読めない）。
 */

interface SqliteStatement {
  all(...params: unknown[]): Record<string, unknown>[];
  run(...params: unknown[]): unknown;
}
interface SqliteDb {
  prepare(sql: string): SqliteStatement;
  exec(sql: string): void;
}

/** node:sqlite を D1（env.DB）互換に見せるアダプタ。 */
function makeD1Adapter(db: SqliteDb) {
  return {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            _sql: sql,
            _args: args,
            async all() {
              return { results: db.prepare(sql).all(...args) };
            },
            async run() {
              db.prepare(sql).run(...args);
              return { success: true };
            },
          };
        },
      };
    },
    async batch(stmts: { _sql: string; _args: unknown[] }[]) {
      db.exec("BEGIN");
      try {
        // D1 と同じく、文ごとの結果（RETURNING の行を含む）を返す。
        const results = stmts.map((s) => ({
          results: db.prepare(s._sql).all(...s._args),
        }));
        db.exec("COMMIT");
        return results;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
  };
}

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === "string") headers.set(k, v);
  }
  const method = req.method ?? "GET";
  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await new Promise((resolve) => {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => resolve(data));
    });
  }
  return new Request(`http://localhost${req.url ?? "/"}`, {
    method,
    headers,
    body,
  });
}

async function writeWebResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(await response.text());
}

export interface DevPersistenceOptions {
  /** 体験版（/api/trial/check）がカーリルを呼ぶための appkey（.env.local の CALIL_APP_KEY）。 */
  calilAppKey?: string;
}

export function devPersistencePlugin(options: DevPersistenceOptions = {}): Plugin {
  return {
    name: "dev-persistence-d1",
    async configureServer(server) {
      // node:sqlite は実験的。import()/require() で参照するとビルドツールが静的
      // リンクし、フラグ無しの build/test 起動が失敗する。process.getBuiltinModule
      // はバンドラの解析対象外なので回避できる。
      // また vitest は起動時に configureServer を実行するため、node:sqlite が
      // 有効でない（--experimental-sqlite なし＝test/build）場合は no-op にする。
      // 実セットアップは `npm run dev`（フラグ付き）のときだけ走る。
      const getBuiltin = (
        process as unknown as {
          getBuiltinModule?: (id: string) => unknown;
        }
      ).getBuiltinModule;
      const sqlite = getBuiltin
        ? (getBuiltin.call(process, "node:sqlite") as
            | { DatabaseSync?: new (filename: string) => SqliteDb }
            | undefined)
        : undefined;
      if (sqlite?.DatabaseSync === undefined) {
        return; // node:sqlite 未有効（test/build 等）→ dev 永続化はスキップ
      }
      const DatabaseSyncCtor = sqlite.DatabaseSync;
      const fs = await import("node:fs");
      const path = await import("node:path");

      const root = process.cwd();
      const db = new DatabaseSyncCtor(path.resolve(root, ".dev.d1.sqlite"));

      // マイグレーション適用（本番は wrangler d1 migrations apply が同じ
      // infra/d1/migrations/ を適用する）。ローカルは連番順に流して
      // .dev.d1.sqlite を構築する。各文は IF NOT EXISTS 等で冪等。
      const migrationsDir = path.resolve(root, "infra/d1/migrations");
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .map((name) => ({
          name,
          content: fs.readFileSync(path.resolve(migrationsDir, name), "utf8"),
        }));
      for (const stmt of orderedMigrationStatements(migrationFiles)) {
        db.exec(stmt + ";");
      }

      const publicDir = path.resolve(root, "public");
      const env = {
        DB: makeD1Adapter(db),
        AUTH_MOCK: "1",
        GOOGLE_CLIENT_ID: "dev",
        SESSION_SECRET: "dev-session-secret",
        CALIL_APP_KEY: options.calilAppKey ?? "",
        TRIAL_IP_SALT: "dev-trial-salt",
        // Pages の env.ASSETS 相当: public/ の静的ファイルを返す。
        ASSETS: {
          async fetch(input: URL | string) {
            const pathname = decodeURIComponent(new URL(String(input)).pathname);
            const file = path.resolve(publicDir, `.${pathname}`);
            if (!file.startsWith(publicDir) || !fs.existsSync(file)) {
              return new Response("Not Found", { status: 404 });
            }
            const type = file.endsWith(".json") ? "application/json" : "application/octet-stream";
            return new Response(fs.readFileSync(file), { headers: { "content-type": type } });
          },
        },
      };

      const routes: Record<string, string> = {
        // 認証・セッションも本番と同じ function を実行し、ローカルでも
        // 「mock ログイン → Cookie 発行 → リロードで /api/me 復元」を再現する。
        "/api/session": "functions/api/session.js",
        "/api/me": "functions/api/me.js",
        "/api/registered-libraries": "functions/api/registered-libraries.js",
        "/api/search-history": "functions/api/search-history.js",
        "/api/trial/check": "functions/api/trial/check.js",
      };

      for (const [route, file] of Object.entries(routes)) {
        const modulePath = path.resolve(root, file);
        server.middlewares.use(route, (req, res) => {
          void (async () => {
            try {
              const mod = (await server.ssrLoadModule(modulePath)) as {
                onRequest?: (c: unknown) => Promise<Response>;
                onRequestGet?: (c: unknown) => Promise<Response>;
                onRequestPut?: (c: unknown) => Promise<Response>;
                onRequestPost?: (c: unknown) => Promise<Response>;
                onRequestDelete?: (c: unknown) => Promise<Response>;
              };
              const request = await toWebRequest(req);
              const byMethod: Record<
                string,
                ((c: unknown) => Promise<Response>) | undefined
              > = {
                GET: mod.onRequestGet,
                PUT: mod.onRequestPut,
                POST: mod.onRequestPost,
                DELETE: mod.onRequestDelete,
              };
              const handler = byMethod[request.method] ?? mod.onRequest;
              if (handler === undefined) {
                res.statusCode = 405;
                res.end();
                return;
              }
              const response = await handler({
                request,
                env,
                waitUntil: (p: Promise<unknown>) => void p,
              });
              await writeWebResponse(res, response);
            } catch (e) {
              res.statusCode = 500;
              res.end(String(e));
            }
          })();
        });
      }
    },
  };
}
