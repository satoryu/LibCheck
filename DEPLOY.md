# デプロイ / 構成（Cloudflare Pages）

LibCheck は **Cloudflare Pages** で配信する（移設の経緯と段階計画は #78、Cosense「LibCheck 2026/6/17」）。

- 静的サイト: Vite ビルド（`dist`）を Cloudflare Pages が配信。SPA フォールバックは `public/_redirects`。
- API: **Pages Functions**（`functions/api/calil/[action].js`）が `/api/calil/{action}` を担い、`library`/`check` のみ許可・`CALIL_APP_KEY` をサーバー注入・`cache-control: no-store`。
- クライアントは `/api/calil`（`src/data/datasources/calilApiConfig.ts`）を叩く。`CALIL_APP_KEY` はクライアントに配信されない。

## ローカル実行

### A) Vite 開発サーバ（日常開発・HMR）
`/api/calil` は vite の dev proxy が `api.calil.jp` へ転送し、`CALIL_APP_KEY` を注入する。
```bash
cp .env.local.example .env.local   # CALIL_APP_KEY=... を記入（VITE_ プレフィックス無し）
npm run dev                         # http://localhost:5173
```

### B) Cloudflare Pages の本番同等エミュレーション
Pages Functions を含めて本番に近い形で動かす。
```bash
echo 'CALIL_APP_KEY=...' > .dev.vars   # gitignore 済み・wrangler pages dev が読む
npm run pages:dev                       # build → npx wrangler pages dev（functions/ を含む）
```

## デプロイ（Cloudflare Pages / GitHub Actions）

`main` への push で `.github/workflows/cloudflare-pages.yml` が `npm run build`（`VITE_AMAZON_ASSOCIATE_TAG` 注入）→ `wrangler pages deploy` を実行する。`workflow_dispatch` で手動実行も可。

### 一度きりのセットアップ
1. **Cloudflare アカウント**で Pages プロジェクトを作成（名前 `libcheck` = `wrangler.toml` の `name`）。
   ```bash
   npx wrangler pages project create libcheck --production-branch main
   ```
2. **API トークン**を発行（権限: Account → Cloudflare Pages → Edit）。Account ID も控える。
3. **GitHub Secrets** に登録:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. **Pages の環境変数**に `CALIL_APP_KEY`（本番シークレット）を設定（Functions が `env.CALIL_APP_KEY` で参照）。
   ```bash
   npx wrangler pages secret put CALIL_APP_KEY --project-name libcheck
   ```
5. （任意）アフィリエイトタグはビルド時に GitHub Variable `AMAZON_ASSOCIATE_TAG` から注入（既存）。

## セキュリティ上のポイント
- `CALIL_APP_KEY` は Cloudflare 側のみ（バンドル非混入）。Function はクライアントの `appkey` をサーバー値で常に上書きし、許可アクションは `library`/`check` のみ。
- `cache-control: no-store`（シークレット由来の応答をキャッシュしない）。

## レガシー（Azure・デコミッション予定）
- 旧 Azure Static Web Apps 本番は移設検証が済むまで稼働させたまま残す。Bicep IaC は `infra/` に残置（#78 のデコミッション工程で撤去）。
- Azure 固有の配信設定（`staticwebapp.config.json`）・Azure Functions（`api/`）・SWA デプロイワークフローは本移設で削除済み。
