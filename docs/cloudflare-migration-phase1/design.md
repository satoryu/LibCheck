# Cloudflare 移設 Phase 1 — Design

## Architecture Overview

Cloudflare Pages が静的サイト（`dist`）を配信し、同一プロジェクトの **Pages Functions**（`functions/` ディレクトリ）が `/api/*` を担う。`/api/calil/{action}` は Calil プロキシ。Pages Functions は静的アセット・`_redirects` より優先して評価されるため、API と SPA フォールバックが両立する。

```mermaid
flowchart TD
  Browser -->|/...| Pages[Cloudflare Pages 静的配信 dist]
  Browser -->|/api/calil/action| Fn[Pages Functions: functions/api/calil/[action].js]
  Fn -->|appkey をサーバー注入| Calil[(api.calil.jp)]
  Pages -->|未知パス| Redir[_redirects /* /index.html 200] --> SPA[index.html]
```

## Component Design

### `functions/api/calil/[action].js`（新規・Pages Function）
- `onRequestGet(context)` を実装。`context.params.action`、`context.env.CALIL_APP_KEY`、`context.request`。
- 現行 `calilProxy.js` と同等: `ALLOWED = {library, check}` 以外は 404／`CALIL_APP_KEY` 未設定は 500／クライアントのクエリを転送しつつ `appkey` をサーバー値で上書き／上流失敗は 502／成功は本文をそのまま返し `content-type` 引継ぎ・`cache-control: no-store`。
- Workers native の `fetch`/`URL`/`Response` を使用（追加依存なし）。

### `public/_redirects`（新規）
```
/*    /index.html   200
```
- 既存アセットは Pages が直接配信、`/api/*` は Functions が先に処理するため、未知パスのみ `index.html` にフォールバック（SWA の navigationFallback 相当）。

### `wrangler.toml`（新規）
```toml
name = "libcheck"
pages_build_output_dir = "dist"
compatibility_date = "2026-06-01"
```

### ローカル開発（変更最小）
- `npm run dev`（Vite）と **既存の vite dev proxy をそのまま維持**（`/api/calil`→`api.calil.jp`、`CALIL_APP_KEY` を `.env.local` から注入）。Phase 1 では wrangler ローカル実行は必須にしない（認証/D1 を扱う後続フェーズで導入検討）。
- クライアントの `calilApiConfig.baseUrl='/api/calil'` は不変（Pages Functions のルートと一致）。

### デプロイ `.github/workflows/cloudflare-pages.yml`（新規）
- `on: push: [main]` + `workflow_dispatch`。
- ステップ: checkout → `npm ci` → `npm run build`（`env: VITE_AMAZON_ASSOCIATE_TAG: ${{ vars.AMAZON_ASSOCIATE_TAG }}`）→ `cloudflare/wrangler-action` で `wrangler pages deploy dist --project-name=libcheck`。
- シークレット: `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`（GitHub Secrets）。`CALIL_APP_KEY` は Cloudflare Pages プロジェクトの環境変数（Functions 実行時に `env` で参照）として設定。

### Azure からの切り離し（Phase 1 のスコープ）
- 削除: `public/staticwebapp.config.json`、`.github/workflows/azure-static-web-apps.yml`、`api/`（Calil プロキシは functions/ へ移行）、`swa:start` スクリプト + `@azure/static-web-apps-cli` devDep。
- 残置（後続のデコミッションまで）: 稼働中の Azure 本番リソース本体、`infra/`(Bicep) と `infra.yml`（Azure 撤去まで現行 Azure を記述）。
- `DEPLOY.md` を Cloudflare 手順へ更新（Azure 記述は移行済みとして整理）。

## Data Flow
1. ブラウザ → `/api/calil/library?...`（`appkey` 空） → Pages Function。
2. Function が `CALIL_APP_KEY` を注入し `api.calil.jp` へ転送 → 応答を `no-store` で返す。
3. SPA ルートは静的配信＋`_redirects` フォールバック。

## セキュリティ
- `CALIL_APP_KEY` は Cloudflare 側のみ（バンドル非混入）。Function はクライアントの `appkey` を常に上書き。許可アクションは `library`/`check` のみ。

## 検証
1. ローカル: `npm run dev` で検索動作、`npx tsc -b`、`npm test`。
2. Cloudflare: `*.pages.dev` で AC-1〜AC-4 を実機確認（Playwright 可）。
