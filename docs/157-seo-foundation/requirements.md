# Requirements — #157 SEO基盤: 公開ルートの分離とルート別メタ情報の配信

## Problem Statement

親Issue #155（[Epic] Google 検索からの流入を増やすための SEO 改善）で、地域ページ公開（#158）・ISBN検索結果ページの部分公開（#159）を進める前提として、以下2つの技術的制約を解消する必要がある。

1. `AuthGate` が Router 全体を包んでいるため（`src/App.tsx`）、未ログイン時はどの URL でも同一の `LandingPage` が返る。ルート単位で「ログイン不要のページ」を作れない。
2. `index.html` が静的1種類のみで、`<title>` / `description` / `canonical` / OGP が全ページ共通固定。個別ページを公開しても Google には `/` の重複として扱われる。

本Issueはこの2点の**仕組み**を作る。**#157 自体では、既存のどの製品ルートも公開範囲を変更しない**（後述「スコープ」参照）。実際にどのルートを公開するかは #158・#159 が本Issueの仕組みを使って行う。

## 事前スパイク検証（2026-08 実施）

CLAUDE.md の方針（未知は決定前にスパイク検証）に従い、実装前に Cloudflare Pages Functions のローカルエミュレーション（`npx wrangler pages dev dist`）で以下を検証した。

- `HTMLRewriter`（Workers ランタイム API）は Pages Functions で**問題なく動作する**。`env.ASSETS.fetch(request)` で静的アセットのレスポンスを取得し、`HTMLRewriter#transform()` で `<title>` / `<meta name="description">` / `<link rel="canonical">` / `<meta property="og:title">` などを書き換えられることを確認した。
- ルート直下の `functions/_middleware.js` に `onRequest(context)` を置き、`context.next()` を使えば、**`/api/*` や静的アセット（JS/PNG 等）には一切影響を与えず**、HTML レスポンスのみを選択的に書き換えられることを確認した（`/api/me` は書き換え後も従来どおり 401 を返した）。
- 上記により、SSRフレームワークへの移行や `react-helmet` 等のクライアント側書き換えは不要と判断できた（既存の却下理由を実証で裏付けた）。

## Requirements

### Functional

- URL（パス）ごとに異なる `<title>` / `<meta name="description">` / `<link rel="canonical">` / OGP を配信できる仕組みがあること。
- 個人向けページ（ログイン必須の既存ページ）には `<meta name="robots" content="noindex">` を出力できること。
- 特定のルートについて、ログインなしでそのルート自身のコンポーネントを描画できる仕組み（ルート単位の `AuthGate` 適用）があること。
- `/api/*` エンドポイントと静的アセット（JS/CSS/画像等）の配信は一切変更されないこと。

### Non-Functional

- 既存の保護ルートの挙動（未ログイン時にランディングへ誘導される）が変わらないこと。
- 追加するミドルウェアが応答時間に無視できない影響を与えないこと。
- Service Worker（PWA オフライン対応）の既存動作を壊さないこと。特に `navigateFallback: '/index.html'`（`vite.config.ts`）により、PWA インストール済みユーザーの**ハードナビゲーション**（外部リンクから直接 URL を開く等）は SW が生成時にプリキャッシュした汎用 `index.html` を返す可能性があり、その場合サーバ側で書き換えたメタ情報は届かない。これはクローラー（Googlebot・SNS プレビュー bot）には影響しない（SW を経由しないため）が、既存の PWA オフライン体験を壊していないことは実機で確認する。

## Constraints

- Pages Functions（`functions/`）は `src/` の React コンポーネントを import できない（別ビルド・別ランタイム）。ルート → メタ情報のマッピングは `functions/_shared/` 配下に独立して持つ。`src/app/router.tsx` のルート定義と重複するため、**両者の同期はコメントで明示し、ルート追加時の変更漏れリスクを README／コメントで残す**（完全な自動同期は本Issueのスコープ外）。
- 動的ルート（`/library/add/:pref/:city`、`/result/:isbn`）に**実データに基づく個別のタイトル・説明文**を出すのは #158・#159 の仕事。本Issueでは静的なプレースホルダ文言 + `noindex`（まだ公開していないため）を出す。
- `wrangler` はローカル環境に `npm install` できない（native build 失敗、CLAUDE.md記載の既知の罠）。検証は `npx wrangler pages dev` のローカルエミュレーションと、マージ後の本番確認で行う。

## スコープの判断（重要）

当初 Issue 起票時点では完了条件に「公開対象としたルートが未ログインで閲覧できる」と書いたが、設計時に以下の理由で **本Issueでは実際の製品ルートを1つも公開しない**方針に変更する。

- どのルートを公開するかは #158（地域ページ）・#159（ISBN結果ページ）で個別に決定・実装する対象であり、#157 が先回りして特定ルートを公開すると、その後続Issueと完了条件が重複し、どちらの成果か曖昧になる。
- 仕組み自体の正しさは、ルーティングのテストコード内で検証用の一時的な公開ルートを使って証明できるため、本番の実ルートを公開しなくても機構の妥当性は担保できる。

このため本Issueの Acceptance Criteria は「仕組みが機能すること」を検証する形に置き換える（下記）。GitHub Issue 本文にもこの判断を追記する。

## Acceptance Criteria

- [ ] ルート単位で `AuthGate` を適用できるコンポーネント（例: `RequireAuth`）があり、ユニットテストで「ラップしたルートは未ログインでも描画される」「ラップしていないルートは未ログイン時にランディングへフォールバックする」の両方を検証できる
- [ ] `functions/_middleware.js` が、既知の各ルートパスに対して固有の `<title>` / `description` / `canonical` を返す（`curl` で確認）
- [ ] 個人向けページ（`/history` `/library` `/scan` `/isbn-input`）に `noindex` が出力される
- [ ] `/api/*` のレスポンス（ステータスコード・ボディ）が変更前と同一である
- [ ] 静的アセット（JS/CSS/画像）が変更前と同一に配信される
- [ ] 既存の保護ルートの挙動（未ログイン時にランディングへ誘導）が変わっていない
- [ ] PWA のオフライン動作（Service Worker の `waiting` に留まらないこと含む）が既存どおりであることをブラウザ実機で確認する
- [ ] 既存のテスト・型チェックが通る

## User Stories

- 検索エンジンのクローラーとして、ページごとに意味のあるタイトル・説明文・正規URLを得たい。
- LibCheck の開発者として、#158・#159 で実際にページを公開する際、車輪の再発明をせず共通の仕組みに乗せたい。
- 既存ユーザーとして、この変更によってログイン必須ページの挙動やPWAのオフライン体験が変わらないでほしい。
