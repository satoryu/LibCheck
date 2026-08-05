# #151 SEO対策: sitemap.xml・canonical・構造化データを追加 — Requirements

## Problem Statement

LibCheck は全機能が Google 認証必須の SPA であり、未ログイン時に表示される
ランディングページ（`/`）だけが検索エンジンにとって意味のあるコンテンツである
（ログイン後の画面はクローラーに見せる必要もなく、見せるべきでもない）。
現状、そのランディングページにも `sitemap.xml`・canonical・構造化データ
（JSON-LD）がなく、技術的に取りこぼしている状態。

## Requirements

### Functional

- FR-1: `public/sitemap.xml` を追加し、`/` を1エントリとして登録する。
- FR-2: `index.html` に `<link rel="canonical" href="https://libcheck.app/">`
  を追加する。
- FR-3: `index.html` に JSON-LD（`schema.org` の `SoftwareApplication` または
  `WebApplication`）を埋め込み、アプリ名・説明・URL・カテゴリ・無料である旨を
  含める。

### Non-Functional

- NFR-1: 既存のビルド・ユニットテスト・型チェックに影響を与えない。
- NFR-2: `robots.txt` から `sitemap.xml` を参照する。

## Constraints

- コンテンツを増やす型の SEO（ブログ・複数ページ）は対象外。全機能ログイン
  必須という製品の性質上、ランディング1枚の技術的な最小改善に絞る。
- SPA は CSR（クライアントサイドレンダリング）のままで、SSR/プリレンダリング
  の導入は本 Issue のスコープ外（別途検討）。

## Acceptance Criteria

- AC-1: 本番 (`https://libcheck.app`) で `sitemap.xml` が 200 で取得できる。
- AC-2: 本番の `/` の HTML に canonical タグと JSON-LD が含まれる。
- AC-3: JSON-LD が Google のリッチリザルトテスト等でエラーなくパースできる
  （構文検証。実際のインデックス反映は本 Issue の完了条件に含めない）。
- AC-4: `npx tsc -b` / `npm test` 緑。

## User Stories

- US-1: 図書館サービスを探しているユーザーとして、検索結果や SNS シェアで
  LibCheck が正しく・リッチに表示されてほしい。
