# Issue #52: Design - results[0]ハードコード修正

## Architecture Overview

`BookSearchResultPage` 内の `results[0]` 参照を、ISBN による明示的な検索に変更する。

## Component Design

### 変更箇所

```mermaid
graph LR
    A["results[0]"] -->|変更| B["results.firstWhere((r) => r.isbn == isbn)"]
```

### 変更対象メソッド

1. `_saveSearchHistory`: 検索履歴保存時の結果参照
2. `_buildResultState`: 検索結果表示時の結果参照

### ヘルパーメソッド

ISBNによる結果検索ロジックを共通化するため、`_findResultForIsbn` ヘルパーメソッドを追加する。

```dart
BookAvailability? _findResultForIsbn(List<BookAvailability> results) {
  return results.where((r) => r.isbn == isbn).firstOrNull;
}
```

## Data Flow

変更なし。

## Domain Models

変更なし。
