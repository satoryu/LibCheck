# 実装タスク: sitemap.xml の作り直し忘れを CI で検知する（#193）

TDD で進める（失敗するテストを先に書く → 実装 → リファクタ）。

## 1. 差分を出す関数

- [x] `extractSitemapUrls`・`diffSitemapUrls` のテスト → 実装
- [x] `buildExpectedSitemapXml` を追加し、`writeSitemap` もこれを使うよう整理（既存テストが通ること）

## 2. sitemap とのずれを検知するテスト

- [x] `scripts/sitemapDrift.test.mjs` を追加（現在の sitemap で通る）
- [x] ガイドの HTML を一時的に1本足して失敗すること・メッセージを確認し、元に戻す（AC2）。作り直せば通ることも確認（AC3）

## 3. 全体確認

- [x] `npm test` / `npx tsc -b` / `npm run build`
- [ ] PR 作成・セルフレビュー → CI で実行されていることを確認 → マージ
