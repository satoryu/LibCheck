# Tasks — #158 地域（自治体×図書館）ページを認証なしで公開する

- [x] 開発環境の準備（`feature/158-regional-pages` ブランチ作成）
- [x] データ静的化方式の検討・ユーザー確認（① 手動スクリプト・随時更新を採用）
- [x] `requirements.md` 作成
- [x] `design.md` 作成
- [x] `checkBookAvailability` の呼び出し箇所を grep 調査 → 当初案（リポジトリ全体差し替え）の欠陥を発見、設計修正

## 実装（TDD）

### 1. データ生成スクリプト
- [x] `scripts/generateLibraryData.mjs` の純粋関数部分（snake_case→camelCase変換、sitemap XML生成）を切り出し、`scripts/generateLibraryData.test.mjs` でユニットテスト（RED確認済み、9 tests green）
- [x] スクリプト本体を実装（カーリル直接呼び出し・500ms間隔・ログにキーを出さない）
- [x] `package.json` に `generate:library-data` スクリプトを登録

### 2. 静的データソース・リポジトリ改修
- [x] `staticLibraryDataSource.test.ts` を作成（RED確認済み）: 正常系・404・baseUrl既定値
- [x] `staticLibraryDataSource.ts` を実装（GREEN, 3 tests）
- [x] `libraryRepositoryImpl.test.ts` を更新: `getLibraries` が静的データソース経由になったことを検証、`checkBookAvailability` が無変更であることを回帰確認（6 tests）
- [x] `libraryRepositoryImpl.ts` を改修（当初「リポジトリ全体差し替え」案から「getLibraries メソッドのみ差し替え」に設計修正。理由は design.md）
- [x] `src/app/dependencies.tsx` / `src/test/testUtils.tsx` の配線を更新

### 3. 初回データ生成
- [x] `.env.local` の `CALIL_APP_KEY` を使ってスクリプトを実行し、`public/data/libraries/*.json`（47件）を生成
- [x] 生成結果の妥当性を確認（47都道府県・図書館7,500件・市区町村1,481件、東京都.jsonのサンプル形式を確認）

### 4. ルーティング・メタ情報
- [x] `publicPaths.ts` の `PUBLIC_PATHS` に3パターンを追加
- [x] `routeMeta.js` の3エントリを `noindex` なし・固有タイトル/descriptionに変更（動的セグメント値を反映する関数形式に拡張）
- [x] `routeMeta.test.ts` を更新（10 tests）
- [x] `_middleware.js` を拡張: 公開ルートは description/canonical/OGP も書き換え、非公開ルートは従来どおり noindex のみ（7 tests）

### 5. sitemap.xml
- [x] 生成スクリプトが `public/sitemap.xml` を再生成することを確認（1530 URL = 1(`/`) + 1(`/library/add`) + 47都道府県 + 1481市区町村）

### 6. ログイン導線
- [x] `LibraryListPage.tsx`: 未ログインで「登録する」を押した場合、スナックバー表示 + ランディングへ遷移する導線を実装
- [x] 対応するテストを追加。既存テストの前提（`authUser` 省略）が変わるため、`renderPage` ヘルパーの既定値をログイン済みに変更し、既存テストの意図（認証済みでの登録フロー）を保ったまま新規テスト（未ログイン）を追加

### 7. 検証
- [x] `npm test` が通る（479 tests passed）
- [x] `npx tsc -b` が通る
- [x] `npx wrangler pages dev` で3ルートの title/description/canonical/noindex 有無を `curl` 確認（`/` は index,follow のまま無変更、3ルートは noindex なし・固有メタ情報を確認）

## ブラウザ実機確認（Claude in Chrome）

- [x] 未ログインで3ルートが閲覧できる（都道府県選択→神奈川県→横浜市の図書館一覧まで実際に操作して確認）
- [x] `performance.getEntriesByType('resource')` で `calil` へのリクエストが0件、`/data/libraries/*.json` のみフェッチされることを確認
- [x] 未ログインで登録を試みると、実アプリのルーター（`RootAuthGate`）経由でランディングへ誘導されることを確認
- [x] カーリルへのリンクバックが未ログインでも表示される
- [x] SW プリキャッシュに `public/data/libraries/`（3.1MB）が巻き込まれていないことを確認（`dist/sw.js` に文字列が含まれないことを確認）

> 検証中、ブラウザが以前の wrangler dev セッションの古いバンドルをSWキャッシュ経由で配信し続ける事象に遭遇した（`index-CFQsOWay.js` vs 実際のビルド `index-C6Awo8Fl.js`）。SW解除・キャッシュクリアで解消。既知の罠として今後も留意する。

## リリース

- [ ] PR 作成（Test Plan に検証結果を記載）
- [ ] 自己コードレビュー
- [ ] CI green を確認しつつ `scripts/watch-pr.sh` 経由でマージ
- [ ] 本番デプロイ監視
- [ ] `scripts/smoke.sh` 実行・全項目パス確認
- [ ] 本番で3ルートの公開・静的データ配信・sitemap 反映を確認
- [ ] PR / Issue に検証結果を記録してクローズ
