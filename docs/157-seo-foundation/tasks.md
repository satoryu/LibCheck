# Tasks — #157 SEO基盤: 公開ルートの分離とルート別メタ情報の配信

- [x] 開発環境の準備（`feature/157-seo-foundation` ブランチ作成）
- [x] `HTMLRewriter` が Pages Functions で動くかスパイク検証（`npx wrangler pages dev` ローカルエミュレーション）
  - [x] `env.ASSETS.fetch()` + `HTMLRewriter#transform()` で title/description/canonical/OGP を書き換え可能と確認
  - [x] ルート直下 `_middleware.js` + `context.next()` で `/api/*` と静的アセットに影響を与えず HTML のみ選択的に書き換え可能と確認
- [x] 既存テストアーキテクチャの制約を調査（`renderRouteWithProviders` が `routes` を直接使う・`authUser` 省略時は null）
- [x] `requirements.md` 作成（スコープ判断: 本Issueでは実ルートを公開しない）
- [x] `design.md` 作成

## 実装（TDD）

### 1. クライアント側: 公開パスの判定
- [x] `src/presentation/auth/publicPaths.test.ts` を作成（RED 確認済み）
  - [x] 完全一致
  - [x] `:pref` 等の動的セグメントを含むパターンのマッチ
  - [x] 既定の `PUBLIC_PATHS`（空配列）では何もマッチしない
- [x] `src/presentation/auth/publicPaths.ts` を実装（GREEN, 8 tests）

### 2. クライアント側: RootAuthGate
- [x] `RootAuthGate.test.tsx` を作成（RED 確認済み）
  - [x] 非公開パス・未ログイン → ランディング表示
  - [x] 公開パス（テスト用に注入）・未ログイン → 子要素（Outlet）描画
  - [x] ログイン済み → パスに関わらず子要素描画
  - [x] ログアウトで `queryClient.clear()` が呼ばれる
- [x] `RootAuthGate.tsx` を実装（GREEN, 4 tests）
- [x] `AuthGate.tsx` / `AuthGate.test.tsx` を削除

### 3. router.tsx / App.tsx の配線
- [x] `router.tsx`: `createAppRouter()` の最上位に `RootAuthGate` を pathless layout route として追加。`routes` 配列自体は無変更
- [x] `App.tsx`: `<AuthGate>` ラップを除去
- [x] 既存の `App.test.tsx` が無改修のままパスすることを確認（設計の最重要検証点。パス）
- [x] 既存の全ページテストが無改修のままパスすることを確認（458 tests all green）

### 4. エッジ側: ルートメタ情報
- [x] `functions/_shared/routeMeta.test.ts` を作成（RED 確認済み）
  - [x] 既知の静的パスの完全一致
  - [x] 動的セグメント（`:pref` `:city` `:isbn`）のパターンマッチ
  - [x] 未知のパスは `null`
- [x] `functions/_shared/routeMeta.js` を実装（GREEN, 7 tests）

### 5. エッジ側: ミドルウェア
- [x] `index.html` に `<meta name="robots" content="index,follow">` を追加
- [x] `functions/_middleware.js` を実装（軽量フェイク HTMLRewriter でワイヤリングをユニットテスト, 5 tests）
  - [x] `/api/*` は `next()` で素通し
  - [x] `text/html` 以外（静的アセット）は素通し
  - [x] `/` は無変更（既定メタのまま）
  - [x] 既知の非公開ルートは `noindex` + タイトルを付与
  - [x] 未知のパスも安全側で `noindex`

### 6. 検証
- [x] `npm test` が通る（458 tests passed, 78 files）
- [x] `npx tsc -b` が通る
- [x] `npx wrangler pages dev` で以下を `curl` 確認
  - [x] `/` は書き換えなし（#151 の既定メタのまま。`index,follow`）
  - [x] `/history` `/library/add/:pref/:city` `/result/:isbn` が `noindex` + 固有タイトルを返す
  - [x] 未知のパスも安全側で `noindex`
  - [x] `/api/me` が変更前と同一（401）
  - [x] 静的アセット（PNG）が変更前と同一（200, image/png）

## ブラウザ実機確認（Claude in Chrome）

- [x] 未ログインで保護ルート（`/library` `/result/:isbn`）にアクセスするとランディングが表示される（既存挙動が変わっていない）
- [x] PWA の Service Worker が `waiting` に留まらないことを確認（`navigator.serviceWorker.getRegistration()` → `active` あり、`waiting`/`installing` なし）
- [x] SW のプリキャッシュが健全（12エントリ、`index.html` 含む）であることを確認
- [ ] ログイン済みでの各ページ表示・オフライン時の詳細動作は、本Issueでは実ルートを公開していない（既存の保護ルートのまま）ため、通常の回帰確認の範囲を超える深掘りは不要と判断

## リリース

- [ ] PR 作成（Test Plan に検証結果を記載）
- [ ] 自己コードレビュー（Correctness / Readability / Performance / Security / Maintainability）
- [ ] CI green を確認しつつ `scripts/watch-pr.sh` 経由でマージ
- [ ] 本番デプロイ監視（`gh run watch`）
- [ ] `scripts/smoke.sh` 実行・全項目パス確認
- [ ] 本番で `noindex` 出力・`/` の既定メタ維持・`/api/*` 無影響を確認
- [ ] PR / Issue に検証結果を記録してクローズ
