# Issue #11: 登録図書館の管理 - 設計

## Architecture Overview

既存の `LocalStorageRepository` を活用し、登録図書館の永続化を行う。`RegisteredLibraryRepository` を新設して図書館の CRUD 操作をカプセル化する。BottomNavigationBar は go_router の `StatefulShellRoute` で実装し、タブごとに独立したナビゲーションスタックを持たせる。

```mermaid
graph TD
    subgraph Presentation["Presentation Layer"]
        Shell["AppShell (BottomNavigationBar)"]
        LibMgmtPage["LibraryManagementPage"]
        LibListPage["LibraryListPage (既存)"]
        HomePage["HomePage (既存)"]
        HistoryPlaceholder["HistoryPage (プレースホルダー)"]
        RegLibProvider["registeredLibrariesProvider"]
        Router["AppRouter (StatefulShellRoute)"]
    end

    subgraph Domain["Domain Layer"]
        RegLibRepo["RegisteredLibraryRepository"]
        LibModel["Library"]
    end

    subgraph Data["Data Layer"]
        RegLibRepoImpl["RegisteredLibraryRepositoryImpl"]
        LocalStorage["LocalStorageRepository"]
        SharedPrefs["SharedPreferences"]
    end

    Router --> Shell
    Shell --> HomePage
    Shell --> LibMgmtPage
    Shell --> HistoryPlaceholder
    LibMgmtPage --> RegLibProvider
    LibListPage --> RegLibProvider
    RegLibProvider --> RegLibRepo
    RegLibRepo --> RegLibRepoImpl
    RegLibRepoImpl --> LocalStorage
    LocalStorage --> SharedPrefs
```

## Component Design

### Domain Layer

#### `lib/domain/models/library.dart` (既存を拡張)

`Library` モデルに `toJson()` / `fromJson()` を追加し、ローカルストレージへの永続化を可能にする。

```dart
class Library {
  // 既存フィールド...

  Map<String, dynamic> toJson() => { /* ... */ };

  factory Library.fromJson(Map<String, dynamic> json) => Library( /* ... */ );
}
```

#### `lib/domain/repositories/registered_library_repository.dart` (新規)

登録図書館の CRUD 操作を定義する抽象クラス。

```dart
abstract class RegisteredLibraryRepository {
  Future<List<Library>> getAll();
  Future<void> saveAll(List<Library> libraries);
  Future<void> add(Library library);
  Future<void> addAll(List<Library> libraries);
  Future<void> remove(Library library);
}
```

### Data Layer

#### `lib/data/repositories/registered_library_repository_impl.dart` (新規)

`LocalStorageRepository` を使って登録図書館を JSON 文字列として永続化する。

```dart
class RegisteredLibraryRepositoryImpl implements RegisteredLibraryRepository {
  static const _storageKey = 'registered_libraries';

  final LocalStorageRepository _localStorage;
  // JSON エンコード/デコードで Library リストを永続化
}
```

### Presentation Layer

#### `lib/presentation/pages/app_shell.dart` (新規)

BottomNavigationBar を持つシェルウィジェット。`StatefulShellRoute` のシェルとして使用。

```mermaid
classDiagram
    class AppShell {
        +StatefulNavigationShell navigationShell
        +build(context) Widget
    }
```

#### `lib/presentation/pages/library_management_page.dart` (新規)

登録図書館の一覧表示・削除画面。デザインガイドライン 2.2.1 に準拠。

```mermaid
classDiagram
    class LibraryManagementPage {
        +build(context, ref) Widget
        -_showDeleteDialog(context, ref, library)
        -_buildEmptyState(context)
        -_buildLibraryList(context, ref, libraries)
    }

    LibraryManagementPage --> registeredLibrariesProvider
```

#### `lib/presentation/pages/history_placeholder_page.dart` (新規)

Phase 4 まではプレースホルダー。

#### `lib/presentation/providers/registered_library_providers.dart` (新規)

```dart
/// 登録図書館リポジトリのプロバイダー
final registeredLibraryRepositoryProvider = Provider<RegisteredLibraryRepository>(...);

/// 登録済み図書館の状態管理
final registeredLibrariesProvider = AsyncNotifierProvider<RegisteredLibrariesNotifier, List<Library>>(...);
```

`RegisteredLibrariesNotifier` は `AsyncNotifier` を継承し、`build()` でストレージから読み込み、`add()` / `remove()` で状態を更新する。

### Routing

`app_router.dart` を `StatefulShellRoute.indexedStack` に変更し、BottomNavigationBar を実現する。

```dart
StatefulShellRoute.indexedStack(
  builder: (context, state, navigationShell) => AppShell(navigationShell: navigationShell),
  branches: [
    StatefulShellBranch(routes: [
      GoRoute(path: '/', builder: ... => HomePage()),
    ]),
    StatefulShellBranch(routes: [
      GoRoute(path: '/library', builder: ... => LibraryManagementPage()),
    ]),
    StatefulShellBranch(routes: [
      GoRoute(path: '/history', builder: ... => HistoryPlaceholderPage()),
    ]),
  ],
)
// 図書館追加フローは ShellRoute 外のトップレベルルートとして定義
GoRoute(path: '/library/add', ...),
GoRoute(path: '/library/add/:pref', ...),
GoRoute(path: '/library/add/:pref/:city', ...),
```

## Data Flow

### 図書館登録フロー

```mermaid
sequenceDiagram
    actor User
    participant ListPage as LibraryListPage
    participant SelProv as selectedLibrariesProvider
    participant RegProv as registeredLibrariesProvider
    participant Repo as RegisteredLibraryRepository
    participant Storage as LocalStorageRepository

    User->>ListPage: 「登録する」ボタンタップ
    ListPage->>SelProv: 選択された図書館を取得
    ListPage->>RegProv: addAll(selectedLibraries)
    RegProv->>Repo: addAll(libraries)
    Repo->>Storage: setString(key, json)
    Storage-->>Repo: 保存完了
    Repo-->>RegProv: 完了
    RegProv-->>ListPage: 状態更新
    ListPage->>SelProv: clear()
    ListPage-->>User: 図書館管理画面に戻る + SnackBar 表示
```

### 図書館削除フロー

```mermaid
sequenceDiagram
    actor User
    participant MgmtPage as LibraryManagementPage
    participant RegProv as registeredLibrariesProvider
    participant Repo as RegisteredLibraryRepository
    participant Storage as LocalStorageRepository

    User->>MgmtPage: 削除ボタンタップ
    MgmtPage-->>User: 確認ダイアログ表示
    User->>MgmtPage: 「解除する」タップ
    MgmtPage->>RegProv: remove(library)
    RegProv->>Repo: remove(library)
    Repo->>Storage: setString(key, updatedJson)
    Storage-->>Repo: 保存完了
    RegProv-->>MgmtPage: 状態更新
    MgmtPage-->>User: SnackBar「元に戻す」表示

    alt Undo タップ
        User->>MgmtPage: 「元に戻す」タップ
        MgmtPage->>RegProv: add(library)
        RegProv->>Repo: add(library)
        Repo->>Storage: setString(key, restoredJson)
        RegProv-->>MgmtPage: 状態更新
    end
```

## Domain Models

既存の `Library` モデルを拡張（`toJson` / `fromJson` 追加）。新たなドメインモデルの追加は不要。

新規追加:
- `RegisteredLibraryRepository`: 登録図書館の CRUD 操作を定義する抽象クラス
