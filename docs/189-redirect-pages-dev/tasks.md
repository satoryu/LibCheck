# 実装タスク: libcheck.pages.dev へのアクセスを本番ドメインへ 301 転送する（#189）

TDD で進める（失敗するテストを先に書く → 実装 → リファクタ）。

## 1. middleware

- [x] `_middleware.test.ts` に転送のテスト（301 / 308・パスとクエリの保持・`next()` を呼ばない・プレビューと本番と localhost は転送しない）を追加し、失敗させる
- [x] `_middleware.js` に `redirectToCanonicalHost` を実装してテストを通す

## 2. 全体確認

- [x] `npm test` / `npx tsc -b` / `npm run build`
- [x] `wrangler pages dev` に `Host` ヘッダーを付けて、Workers ランタイムでの 301 / 308 とプレビュー・localhost の非転送を確認
- [ ] PR 作成・セルフレビュー
- [ ] マージ後: デプロイ監視 → `scripts/smoke.sh` → 本番で `libcheck.pages.dev` の各種パスが 301（POST は 308）で `libcheck.app` へ転送されることを `curl` で確認 → そのデプロイ固有の URL（`<ハッシュ>.libcheck.pages.dev`。デプロイのログに出る）が転送されず 200 で表示されることを確認 → PR / Issue に記録

補足: CI（cloudflare-pages.yml）は main への push でだけデプロイし、PR ごとのプレビューは作らない。ただし `wrangler pages deploy` はデプロイごとに `<ハッシュ>.libcheck.pages.dev` を作るため、プレビュー用ホスト名が転送されないことはこれで確認できる。
