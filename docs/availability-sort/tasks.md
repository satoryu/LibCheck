# 在庫状況順ソート — Tasks

TDD（失敗するテスト → 実装 → リファクタ）。

- [x] `sortLibrariesByAvailability` のテストを作成（混在ソート/安定性/result未定義/ミューテーション/欠落館）
- [x] `sortLibrariesByAvailability` を実装
- [x] `BookSearchResultPage` の結合テストを拡張（DOM 並び順検証）
- [x] `BookSearchResultPage.resultState` をソート適用に変更
- [x] `npx tsc -b` 通過
- [x] `npm test` 全緑（246 tests）
- [x] In-Browser 動作確認（Calil /check をモックし混在状況で渋谷=貸出可が港区=蔵書なしより上に表示されることを確認）
- [ ] PR 作成・セルフレビュー
