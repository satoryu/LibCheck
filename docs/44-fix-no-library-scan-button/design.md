# Issue #44: Design

## Architecture Overview

`BookSearchResultPage` の `_buildNoLibraryState` メソッドで、`_buildScanAnotherButton` の代わりに「図書館を登録する」ボタンを表示するよう変更する。

## Component Design

### `_buildNoLibraryState` の修正

**変更前:**
```dart
Widget _buildNoLibraryState(BuildContext context) {
  return SingleChildScrollView(
    child: Column(
      children: [
        _buildIsbnSection(context),
        // ... メッセージ表示 ...
        _buildScanAnotherButton(context),  // ← 不適切
      ],
    ),
  );
}
```

**変更後:**
```dart
Widget _buildNoLibraryState(BuildContext context) {
  return SingleChildScrollView(
    child: Column(
      children: [
        _buildIsbnSection(context),
        // ... メッセージ表示 ...
        _buildAddLibraryButton(context),  // ← 図書館登録ボタン
      ],
    ),
  );
}
```

### 新規メソッド `_buildAddLibraryButton`

```dart
Widget _buildAddLibraryButton(BuildContext context) {
  return SizedBox(
    width: double.infinity,
    child: FilledButton.icon(
      onPressed: () {
        context.push('/library/add');
      },
      icon: const Icon(Icons.add),
      label: const Text('図書館を登録する'),
    ),
  );
}
```

## Data Flow

```mermaid
flowchart TD
    A[BookSearchResultPage] --> B{登録済み図書館}
    B -->|0件| C[_buildNoLibraryState]
    C --> D[「図書館を登録する」ボタン]
    D -->|タップ| E[/library/add に遷移]
    B -->|1件以上| F[_buildSearchResults]
    F --> G[「別の本をスキャンする」ボタン]
```
