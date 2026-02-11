# Issue #11: 登録図書館の管理 - タスクリスト

## Tasks

- [x] 1. Library モデルの JSON シリアライズ対応
  - `Library` に `toJson()` / `factory Library.fromJson()` を追加
  - ユニットテスト作成

- [x] 2. RegisteredLibraryRepository の実装
  - `RegisteredLibraryRepository` 抽象クラスの作成
  - `RegisteredLibraryRepositoryImpl` の実装（LocalStorageRepository 使用）
  - ユニットテスト作成

- [x] 3. 登録図書館プロバイダーの実装
  - `registeredLibraryRepositoryProvider` の作成
  - `RegisteredLibrariesNotifier` / `registeredLibrariesProvider` の実装（AsyncNotifier）
  - ユニットテスト作成

- [x] 4. BottomNavigationBar の実装（AppShell + StatefulShellRoute）
  - `AppShell` ウィジェットの作成
  - `app_router.dart` を `StatefulShellRoute.indexedStack` に変更
  - `HistoryPlaceholderPage` の作成
  - ウィジェットテスト・ルーティングテストの更新

- [x] 5. 図書館管理画面の実装
  - `LibraryManagementPage` の実装（一覧表示・空状態・削除確認ダイアログ・Undo SnackBar）
  - ウィジェットテスト作成

- [x] 6. 図書館登録フローの接続
  - `LibraryListPage` の「登録する」ボタンに登録処理を接続
  - 登録後に図書館管理画面へ遷移 + SnackBar 表示
  - 全テストがパスすることの確認
