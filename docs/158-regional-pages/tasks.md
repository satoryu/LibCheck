# Tasks — #158 地域（自治体×図書館）ページを認証なしで公開する

- [x] 開発環境の準備（`feature/158-regional-pages` ブランチ作成）
- [x] データ静的化方式の検討・ユーザー確認（① 手動スクリプト・随時更新を採用）
- [x] `requirements.md` 作成
- [x] `design.md` 作成
- [x] `checkBookAvailability` の呼び出し箇所を grep 調査 → 当初案（リポジトリ全体差し替え）の欠陥を発見、設計修正

## 実装（TDD）

### 1. データ生成スクリプト
- [ ] `scripts/generate-library-data.mjs` の純粋関数部分（snake_case→camelCase変換、sitemap XML生成）を切り出し、`scripts/generate-library-data.test.mjs`（or `.test.ts`）でユニットテスト
- [ ] スクリプト本体を実装（カーリル直接呼び出し・間隔を空ける・ログにキーを出さない）
- [ ] `package.json` に `generate:library-data` スクリプトを登録

### 2. 静的データソース・リポジトリ改修
- [ ] `staticLibraryDataSource.test.ts` を作成（RED）: 正常系・404・不正JSON
- [ ] `staticLibraryDataSource.ts` を実装（GREEN）
- [ ] `libraryRepositoryImpl.test.ts` を更新: `getLibraries` が静的データソース経由になったことを検証、`checkBookAvailability` が無変更であることを回帰確認
- [ ] `libraryRepositoryImpl.ts` を改修
- [ ] `src/app/dependencies.tsx` / `src/test/testUtils.tsx` の配線を更新

### 3. 初回データ生成
- [ ] `.env.local` の `CALIL_APP_KEY` を使ってスクリプトを1回実行し、`public/data/libraries/*.json`（47件）を生成
- [ ] 生成結果の妥当性を確認（件数・サンプルデータの形式）

### 4. ルーティング・メタ情報
- [ ] `publicPaths.ts` の `PUBLIC_PATHS` に3パターンを追加
- [ ] `routeMeta.js` の3エントリを `noindex` なし・固有タイトルに変更（動的セグメント値を反映）
- [ ] `routeMeta.test.ts` を更新

### 5. sitemap.xml
- [ ] 生成スクリプトが `public/sitemap.xml` を再生成することを確認（都道府県47件＋市区町村約1700件＋既存の `/` `/library/add`）

### 6. ログイン導線
- [ ] `LibraryListPage.tsx`: 未ログインで「登録する」を押した場合の導線を実装
- [ ] 対応するテストを追加

### 7. 検証
- [ ] `npm test` が通る
- [ ] `npx tsc -b` が通る
- [ ] `npx wrangler pages dev` で3ルートの title/description/canonical/noindex 有無を `curl` 確認

## ブラウザ実機確認（Claude in Chrome）

- [ ] 未ログインで3ルートが閲覧できる
- [ ] Network 相当のログで `api.calil.jp` / `/api/calil/library` へのリクエストが発生しないことを確認
- [ ] 未ログインで登録を試みるとログイン導線が示される
- [ ] カーリルへのリンクバックが未ログインでも表示される
- [ ] モバイル幅でレイアウトが崩れない

## リリース

- [ ] PR 作成（Test Plan に検証結果を記載）
- [ ] 自己コードレビュー
- [ ] CI green を確認しつつ `scripts/watch-pr.sh` 経由でマージ
- [ ] 本番デプロイ監視
- [ ] `scripts/smoke.sh` 実行・全項目パス確認
- [ ] 本番で3ルートの公開・静的データ配信・sitemap 反映を確認
- [ ] PR / Issue に検証結果を記録してクローズ
