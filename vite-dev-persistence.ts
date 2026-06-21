import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

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
        for (const s of stmts) db.prepare(s._sql).run(...s._args);
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
      return [];
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

export function devPersistencePlugin(): Plugin {
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
      const { pathToFileURL } = await import("node:url");

      const root = process.cwd();
      const db = new DatabaseSyncCtor(path.resolve(root, ".dev.d1.sqlite"));

      // スキーマ適用（CREATE IF NOT EXISTS で冪等）。
      const schema = fs.readFileSync(
        path.resolve(root, "infra/d1/schema.sql"),
        "utf8",
      );
      const stripped = schema
        .split("\n")
        .filter((l) => !l.trim().startsWith("--"))
        .join("\n");
      for (const stmt of stripped.split(";").map((s) => s.trim()).filter(Boolean)) {
        db.exec(stmt + ";");
      }

      const env = { DB: makeD1Adapter(db), AUTH_MOCK: "1", GOOGLE_CLIENT_ID: "dev" };

      const routes: Record<string, string> = {
        "/api/registered-libraries": "functions/api/registered-libraries.js",
        "/api/search-history": "functions/api/search-history.js",
      };

      for (const [route, file] of Object.entries(routes)) {
        const moduleUrl = pathToFileURL(path.resolve(root, file)).href;
        server.middlewares.use(route, (req, res) => {
          void (async () => {
            try {
              const mod = (await import(moduleUrl)) as {
                onRequestGet?: (c: unknown) => Promise<Response>;
                onRequestPut?: (c: unknown) => Promise<Response>;
              };
              const request = await toWebRequest(req);
              const handler =
                request.method === "GET"
                  ? mod.onRequestGet
                  : request.method === "PUT"
                    ? mod.onRequestPut
                    : undefined;
              if (handler === undefined) {
                res.statusCode = 405;
                res.end();
                return;
              }
              const response = await handler({ request, env });
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
