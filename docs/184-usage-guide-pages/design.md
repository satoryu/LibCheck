# 設計: 用途を説明するページを2〜3本追加する（#184）

## Architecture Overview

### 方式の比較

| 案 | 内容 | 判断 |
|---|---|---|
| A. 静的 HTML（`public/guide/*.html`）（採用） | 既存のプライバシーポリシー・利用規約と同じ方式。本文がそのまま配信 HTML になり、JS 不要 | 採用。読み物のページで、操作（React の状態）が要らない |
| B. SPA のルート + middleware で本文を差し込む | #182 の地域ページと同じ方式 | 不採用。本文を配信 HTML 用と React 用の二重に描画する必要があり、読み物のページには過剰 |

### 現状の調査結果

- 静的ページ（`/privacy-policy`・`/terms`）は robots の meta を持たないため、middleware の「未知のパスは `noindex`」の書き換え対象（`meta[name="robots"]`）が存在せず、結果としてインデックス可能で配信されている。
- 本番の Pages は拡張子なしの URL で 200 を返し、`.html` 付きは 308 で拡張子なしへ転送する。ローカルの Vite では拡張子なしは 404。

```mermaid
flowchart LR
  T[トップ / ランディング] -->|.html リンク| G1[/guide/bookstore]
  C[市区町村ページ] -->|.html リンク| G1
  T --> G2[/guide/barcode]
  C --> G2
  T --> G3[/guide/nearby-libraries]
  C --> G3
  G1 <--> G2 <--> G3
  G1 -->|行動を促す欄| A[/library/add 都道府県一覧]
  G2 --> A
  G3 --> A
  S[sitemap.xml] -.拡張子なし.-> G1 & G2 & G3
```

## Component Design

### 1. 静的ページ `public/guide/{slug}.html`（3本）

各ページの `<head>`:

- `<title>`・`meta description`・`link rel="canonical"`（`https://libcheck.app/guide/{slug}`、拡張子なし）
- OGP（`og:type=article`、`og:title`、`og:description`、`og:url`、`og:image` は既存の `og-image.png`）
- `<link rel="stylesheet" href="/guide/guide.css">`（CSP `style-src 'self'` の範囲内）
- JSON-LD: `@graph` に `BreadcrumbList`（トップ > ページ名）と `Article`（`headline`・`description`・`datePublished`・`dateModified`・`author`/`publisher`）
- robots の meta は置かない（既定でインデックス可能。middleware 側でも明示的に素通しにする。後述）

`<body>`: ヘッダー（LibCheck のロゴ文字 → `/`）、パンくず、h1、リード文、本文（h2 の節）、行動を促す欄、ほかの使い方ガイド、フッター。インラインのイベントハンドラ・インラインスクリプトは使わない（CSP）。

### 2. 共有 CSS `public/guide/guide.css`

アプリの配色トークン（`src/presentation/theme/tokens.ts` の `KC_COLORS`）に合わせた読み物向けのスタイル。スマホ幅を基準にし、最大幅 720px。

### 3. ガイドの一覧 `src/presentation/guide/guidePages.ts`（新規・純粋モジュール）

```ts
export interface GuidePage { slug: string; title: string; summary: string; }
export const GUIDE_PAGES: readonly GuidePage[];
export function guideHref(slug: string): string; // '/guide/{slug}.html'
```

トップ・市区町村ページのリンク（配信 HTML と SPA の両方）はここから作る。#182 と同じく `@/` エイリアスを使わず、Functions からも import する。

### 4. middleware / routeMeta

- `routeMeta.js` に `{ pattern: '/guide/:slug', static: true }` を追加し、middleware はこのエントリにマッチしたら**レスポンスに手を加えない**。現在も robots の meta が無いため結果は同じだが、「未知のパス扱いで `noindex` を付ける」経路に依存しないよう明示する。
- トップ（`renderTopRootHtml`）と市区町村ページ（`renderRootHtml`）の差し込み HTML に「使い方ガイド」のリンクを追加する。

### 5. SPA

| ファイル | 変更 |
|---|---|
| `src/presentation/widgets/GuideLinks.tsx`（新規） | `GUIDE_PAGES` からリンク一覧を描画（`<a href>`。静的ページなので React Router は使わない） |
| `src/presentation/landing/LandingPage.tsx` | 「使い方ガイド」セクションを追加（「地域から探す」の前） |
| `src/presentation/pages/LibraryListPage.tsx` | 体験版の下・登録一覧の前に「使い方ガイド」のリンクを追加 |

### 6. sitemap（`scripts/generateSitemap.mjs`）

`public/guide/*.html` のファイル名から `https://libcheck.app/guide/{slug}`（拡張子なし）を追加する（priority 0.6、lastmod）。ファイル一覧から作るため、ページを足したときに sitemap の更新漏れが起きない。

### 7. テスト

- `public/guide/*.html` を読み込む静的ページのテスト（vitest）: title・description・canonical（ファイル名と一致・拡張子なし）・h1・JSON-LD の妥当性・`/library/add` へのリンク・ほかのガイドへのリンク・robots の `noindex` が無い・インラインのイベントハンドラが無い・禁止語（「蔵書検索」「キーワードで」「書名で検索」）が無い・`GUIDE_PAGES` とファイルの一致。
- `routeMeta` / middleware: `/guide/:slug` を素通しにする。
- `regionPageHtml`: トップ・市区町村ページの差し込み HTML にガイドへのリンク。
- `GuideLinks`・`LandingPage`・`LibraryListPage`: ガイドへのリンク。
- `generateSitemap`: ガイドの URL を含む。

## Data Flow

静的ページは Pages の静的配信がそのまま返す。middleware は `/guide/:slug` を素通しにする。動的な処理・API 呼び出しはない。

## Domain Models

新しいドメインモデルはない。`GuidePage` は表示用のデータとして `src/presentation/guide/` に置く。

## 懸念点

1. **`.html` リンクの 308**: アプリ内のリンクは `.html` 付き（CLAUDE.md の Known Pitfalls）のため、本番では1回の 308 転送を挟む。canonical と sitemap は拡張子なしなので、検索エンジンは拡張子なしを正規 URL として扱う。
2. **本文の正確さ**: アプリの実際の挙動（2段バーコードの上段、オフライン時の保留、予約は各図書館のサイトで行う等）に合わせた。実装時にもう一度コードと照合する。
3. **スクリーンショット**: 今回は入れない（画面変更のたびに古くなるため）。必要になったら別途検討する。
