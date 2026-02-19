# Issue #53: Design - router isbn force unwrap修正

## Architecture Overview

`/result/:isbn` ルートの builder で `isbn` パラメータを安全に取得し、欠損時はホームへリダイレクトする。

## Component Design

### 変更前

```dart
final isbn = state.pathParameters['isbn']!;
return BookSearchResultPage(isbn: isbn, source: source);
```

### 変更後

```dart
final isbn = state.pathParameters['isbn'];
if (isbn == null || isbn.isEmpty) {
  return const HomePage();
}
return BookSearchResultPage(isbn: isbn, source: source);
```

## Data Flow

変更なし。

## Domain Models

変更なし。
