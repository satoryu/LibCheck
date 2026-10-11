# 要件定義: sitemap.xml の作り直し忘れを CI で検知する（#193）

## Problem Statement

`public/sitemap.xml` は `npm run generate:sitemap` で作り直してコミットする静的ファイルで、生成元は図書館データ（`public/data/libraries/*.json`）とガイドの HTML（`public/guide/*.html`）。生成元を変えて作り直し忘れても、テストにも CI にも検知する仕組みが無く、古い sitemap が本番に出る。

## Requirements

### Functional

- **F1**: コミットされた sitemap の URL の集合と、生成元から作った URL の集合が一致しなければテストが失敗する。
- **F2**: 比較するのは URL の過不足だけ（lastmod・priority・changefreq は比べない。lastmod は作り直した日で変わるため）。
- **F3**: 失敗メッセージに、足りない URL・余分な URL と「`npm run generate:sitemap -- --lastmod=YYYY-MM-DD` を実行してコミットする」旨を出す。

### Non-Functional

- **NF1**: 既存の `npm test` で動き、CI（`ci.yml`）で自動的に実行される。追加の CI 設定は不要。
- **NF2**: 生成のロジックは `scripts/generateSitemap.mjs` の `buildSitemapXml` をそのまま使い、テスト側で URL の作り方を複製しない。

## Constraints

- sitemap を自動生成してコミットする仕組み（CI での自動更新）は入れない（今の手動運用を前提に、忘れを検知するだけ）。

## Acceptance Criteria

- **AC1**: 現在の `public/sitemap.xml` でテストが通る。
- **AC2**: ガイドの HTML を1本足して作り直さないと、テストが失敗し、メッセージにその URL が「足りない URL」として出る（手元で確認）。
- **AC3**: 作り直せばテストが通る。
- **AC4**: `npm test`・`npx tsc -b`・`npm run build` が通る。

## User Stories

- 開発者として、ページを足したときに sitemap の作り直しを忘れても、CI が気づかせてほしい。
