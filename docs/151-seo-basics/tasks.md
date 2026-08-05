# #151 SEO対策 — Tasks

- [x] T1: `public/sitemap.xml` を追加（`/` のみ）
- [x] T2: `public/robots.txt` に `Sitemap:` 行を追加
- [x] T3: `index.html` に canonical タグを追加
- [x] T4: `index.html` に JSON-LD（`SoftwareApplication`）を追加
- [x] T5: `npx tsc -b` / `npm test` 緑を確認（74ファイル・414テスト）
- [x] T6: ブラウザ（dev サーバ）で `<head>` の内容を確認、JSON-LD の構文を
      検証（`JSON.parse` が通ること。sitemap.xml も XML として妥当性検証済み）
- [ ] T7: PR 作成 → セルフレビュー → CI 緑 → マージ → 本番デプロイ監視 →
      `scripts/smoke.sh`（sitemap.xml の 200 を追加確認）→ 本番で
      canonical/JSON-LD/sitemap を確認 → Issue へ記録
