# 実装タスク: 用途を説明するページを2〜3本追加する（#184）

TDD で進める（失敗するテストを先に書く → 実装 → リファクタ）。各タスク完了ごとにチェックする。

## 0. 確認

- [x] URL 構成・見出し・本文の下書き（`content-draft.md`）についてユーザーの確認を得る（2026-10-10、3本・下書きどおりで承認）

## 1. ガイドの一覧と静的ページ

- [x] `src/presentation/guide/guidePages.ts` のテスト → 実装
- [x] 静的ページのテスト（`public/guide/*.html` を読み込んで検証）を書いて失敗させる
- [x] `public/guide/guide.css` と3本の HTML を作成し、テストを通す

## 2. middleware

- [ ] `routeMeta` / middleware のテスト（`/guide/:slug` を素通し）→ 実装

## 3. 内部リンク

- [ ] `regionPageHtml`: トップ・市区町村ページの差し込み HTML にガイドへのリンク（テスト → 実装）
- [ ] `GuideLinks` ウィジェット（テスト → 実装）
- [ ] `LandingPage`・`LibraryListPage` に組み込む（テスト → 実装）

## 4. sitemap

- [ ] `generateSitemap` のテスト（ガイドの URL・拡張子なし）→ 実装 → `public/sitemap.xml` を再生成

## 5. 全体確認

- [ ] `npm test` / `npx tsc -b` / `npm run build`
- [ ] `wrangler pages dev` で3本・トップ・市区町村ページの配信 HTML を `curl` で確認（h1・title・description・canonical・robots・パンくず・内部リンク・JSON-LD）
- [ ] ブラウザ（スマホ幅・コールドロード）で3本の見た目とリンクを確認
- [ ] PR 作成・セルフレビュー
- [ ] マージ後: デプロイ監視 → `scripts/smoke.sh` → 本番で3本（拡張子なし・`.html` からの 308）とリンクを確認 → PR / Issue に記録
