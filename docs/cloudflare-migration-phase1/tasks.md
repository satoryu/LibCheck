# Cloudflare 移設 Phase 1 — Tasks

## 実装
- [x] `functions/api/calil/[action].js`（Pages Function・Calil プロキシ移植、現行 calilProxy.js と同等挙動）
- [x] `public/_redirects`（SPA フォールバック）
- [x] `wrangler.toml`（name=libcheck, pages_build_output_dir=dist）
- [x] `.github/workflows/cloudflare-pages.yml`（build + wrangler pages deploy、VITE_AMAZON_ASSOCIATE_TAG 注入）
- [x] Azure 切り離し: `staticwebapp.config.json` / `azure-static-web-apps.yml` / `api/` / `swa:start` + swa-cli devDep を削除（infra/・infra.yml は撤去フェーズまで残置）
- [x] `DEPLOY.md` を Cloudflare 手順へ更新、`.dev.vars.example` 追加、`.dev.vars` を gitignore

## Cloudflare 側セットアップ（ユーザー手元）
- [ ] Pages プロジェクト `libcheck` 作成（`wrangler pages project create`）
- [ ] Pages 環境変数 `CALIL_APP_KEY`（本番）設定
- [ ] GitHub Secrets: `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`

## 検証
- [x] `npx tsc -b` / `npm test`（246）グリーン
- [x] `npm run build` 成功・`dist/_redirects` 生成
- [x] Pages Function ロジックを実 Calil で検証（library=200/no-store/JSON配列・キー上書き、foo=404、no-key=500）
- [ ] `*.pages.dev` で SPA 表示・図書館検索・蔵書照会の実機確認（要 Cloudflare セットアップ後）
- [ ] PR 作成・セルフレビュー

## 後続（別フェーズ・#78）
- Phase2 #73 認証 / Phase3 #74 永続化 / #71 ドメイン / Cloudflare IaC / Azure デコミッション
