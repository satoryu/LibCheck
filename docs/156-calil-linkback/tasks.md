# Tasks — #156 カーリルAPI規約: リンクバックの実装

- [x] 開発環境の準備（`feature/156-calil-linkback` ブランチ作成）
- [x] カーリルAPI仕様書の原文を確認し、必要なリンク形式を確定
- [x] URL 形式の疎通確認（`library/search?s=&k=` が 200 を返すことを確認。書籍ページはボット保護のため実機確認に回す）
- [x] `requirements.md` 作成
- [x] `design.md` 作成

## 実装（TDD）

### 1. URL 導出の純粋関数
- [x] `src/domain/utils/calilUrls.test.ts` を作成し、失敗するテストを書く（RED 確認済み）
  - [x] `calilBookUrl`: ISBN13 → `https://calil.jp/book/{ISBN10}`
  - [x] `calilBookUrl`: ISBN10 をそのまま渡した場合
  - [x] `calilBookUrl`: 979 始まり → `null`
  - [x] `calilBookUrl`: 不正な ISBN → `null`
  - [x] `calilLibraryUrl`: 第一形式 `library/{libId}/{正式名称}`、正式名称が URL エンコードされる
  - [x] `calilLibraryUrl`: `libId` が空 → 第二形式 `library/search?s=&k=`
  - [x] `calilLibraryUrl`: `formalName` が空 → 第二形式
- [x] `src/domain/utils/calilUrls.ts` を実装してテストを通す（10 tests green）

### 2. 検索結果画面：書籍ページへのリンク
- [x] `BookMetadataCard.test.tsx` に「カーリルで見る」リンクの検証を追加（RED 確認済み）
- [x] `BookMetadataCard.tsx` に「カーリルで見る」ボタンを追加（Amazon ボタンと同パターン）
- [x] ISBN10 が導出できない場合にボタンを描画しないことをテスト

### 3. 検索結果画面：図書館ページへのリンク
- [x] `LibraryAvailabilityCard.test.tsx` に図書館名リンクの検証を追加（RED 確認済み）
- [x] `LibraryAvailabilityCard.tsx` の図書館名をカーリルへのリンクにする

### 4. 履歴画面：帰属表示
- [x] `SearchHistoryPage.test.tsx` にカーリルへのリンク存在の検証を追加（RED 確認済み）
- [x] `SearchHistoryPage.tsx` の一覧下部に帰属表示リンクを追加
- [x] 履歴が空のときは表示しないことを確認

### 5. 検証
- [x] `npm test` が通る（433 tests passed / 追加 16 件）
- [x] `npx tsc -b` が通る
- [x] #153 で修正した履歴画面の横幅オーバーフローが再発していないことを確認（390px 拘束時オーバーフロー 0）

## ブラウザ実機確認（Claude in Chrome）

- [x] 検索結果画面に「カーリルで見る」と図書館名リンクが表示される（1ページに18件のカーリルリンク）
- [x] 図書館名リンクがカーリルの正しい図書館ページへ遷移する
      → `https://calil.jp/library/104163/大田区立久が原図書館` が「大田区立久が原図書館 | カーリル」に到達。
        ページ内の `Tokyo_Ota / 104163` が生成値と一致
- [x] 書籍リンクがカーリルの正しい書籍ページへ遷移する
      → `https://calil.jp/book/4101010013` が「吾輩は猫である (新潮文庫) | カーリル」に到達
- [x] 履歴画面にカーリルへの帰属表示が表示される
- [x] モバイル幅（390px）でレイアウトが崩れない・横スクロールが出ない（ボタンは縦積みに折り返し）

> 注: カーリルへの負荷を避けるため、実サイトへのアクセスは書籍1件・図書館1件の計2回に留めた。

## リリース

- [ ] PR 作成（Test Plan に検証結果を記載）
- [ ] 自己コードレビュー（Correctness / Readability / Performance / Security / Maintainability）
- [ ] CI green を確認しつつ `scripts/watch-pr.sh` 経由でマージ
- [ ] 本番デプロイ監視（`gh run watch`）
- [ ] `scripts/smoke.sh` 実行・全項目パス確認
- [ ] 本番でリンクが正しく機能することを確認
- [ ] PR / Issue に検証結果を記録してクローズ
