# Issue #10: 図書館一覧表示・選択 - タスクリスト

## Tasks

- [x] 1. 図書館一覧取得プロバイダーの実装
  - `LibraryListParam` パラメータクラスの作成
  - `libraryListProvider` の実装（`FutureProvider.family`）
  - ユニットテスト作成

- [x] 2. 選択状態管理プロバイダーの実装
  - `selectedLibrariesProvider` の実装（`StateProvider`）
  - ユニットテスト作成

- [x] 3. 図書館一覧画面の実装
  - `LibraryListPage` の実装（チェックボックス付きリスト）
  - ローディング・エラー状態の表示
  - 選択数表示と「登録する」ボタン
  - ウィジェットテスト作成

- [x] 4. ルーティングの更新
  - `app_router.dart` のプレースホルダーを `LibraryListPage` に置き換え
  - ルーティングテストの更新
  - 全テストがパスすることの確認
