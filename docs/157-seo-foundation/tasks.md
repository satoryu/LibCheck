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
- [ ] `src/presentation/auth/publicPaths.test.ts` を作成（RED）
  - [ ] 完全一致
  - [ ] `:pref` 等の動的セグメントを含むパターンのマッチ
  - [ ] 既定の `PUBLIC_PATHS`（空配列）では何もマッチしない
- [ ] `src/presentation/auth/publicPaths.ts` を実装（GREEN）

### 2. クライアント側: RootAuthGate
- [ ] `RootAuthGate.test.tsx` を作成（RED）
  - [ ] 非公開パス・未ログイン → ランディング表示
  - [ ] 公開パス（テスト用に注入）・未ログイン → 子要素（Outlet）描画
  - [ ] ログイン済み → パスに関わらず子要素描画
  - [ ] ログアウトで `queryClient.clear()` が呼ばれる
- [ ] `RootAuthGate.tsx` を実装（GREEN）
- [ ] `AuthGate.tsx` / `AuthGate.test.tsx` を削除

### 3. router.tsx / App.tsx の配線
- [ ] `router.tsx`: `createAppRouter()` の最上位に `RootAuthGate` を pathless layout route として追加。`routes` 配列自体は無変更
- [ ] `App.tsx`: `<AuthGate>` ラップを除去
- [ ] 既存の `App.test.tsx` が無改修のままパスすることを確認（設計の最重要検証点）
- [ ] 既存の全ページテストが無改修のままパスすることを確認

### 4. エッジ側: ルートメタ情報
- [ ] `functions/_shared/routeMeta.test.ts` を作成（RED）
  - [ ] 既知の静的パスの完全一致
  - [ ] 動的セグメント（`:pref` `:city` `:isbn`）のパターンマッチ
  - [ ] 未知のパスは `null`
- [ ] `functions/_shared/routeMeta.js` を実装（GREEN）

### 5. エッジ側: ミドルウェア
- [ ] `index.html` に `<meta name="robots" content="index,follow">` を追加
- [ ] `functions/_middleware.js` を実装
  - [ ] `/api/*` は `next()` で素通し
  - [ ] `text/html` 以外（静的アセット）は素通し
  - [ ] `/` は無変更（既定メタのまま）
  - [ ] 既知の非公開ルートは `noindex` + タイトルを付与
  - [ ] 未知のパスも安全側で `noindex`

### 6. 検証
- [ ] `npm test` が通る
- [ ] `npx tsc -b` が通る
- [ ] `npx wrangler pages dev` で以下を `curl` 確認
  - [ ] `/` は書き換えなし（#151 の既定メタのまま）
  - [ ] `/history` `/library` 等が `noindex` + 固有タイトルを返す
  - [ ] `/api/me` が変更前と同一（401）
  - [ ] 静的アセット（JS/PNG）が変更前と同一

## ブラウザ実機確認（Claude in Chrome）

- [ ] 未ログインで保護ルートにアクセスするとランディングが表示される（既存挙動が変わっていない）
- [ ] ログイン済みなら各ページが通常どおり表示される
- [ ] PWA の Service Worker 更新が `waiting` に留まらないことを確認（`navigator.serviceWorker.getRegistration()`）
- [ ] オフライン時の既存動作（#143/#144）が壊れていないことを確認

## リリース

- [ ] PR 作成（Test Plan に検証結果を記載）
- [ ] 自己コードレビュー（Correctness / Readability / Performance / Security / Maintainability）
- [ ] CI green を確認しつつ `scripts/watch-pr.sh` 経由でマージ
- [ ] 本番デプロイ監視（`gh run watch`）
- [ ] `scripts/smoke.sh` 実行・全項目パス確認
- [ ] 本番で `noindex` 出力・`/` の既定メタ維持・`/api/*` 無影響を確認
- [ ] PR / Issue に検証結果を記録してクローズ
