# Issue #10: 蔵書検索・結果表示 - 設計

## Architecture Overview

Clean Architecture に基づき、既存の domain/data 層を活用して presentation 層に検索結果画面を追加する。

```mermaid
graph TD
    subgraph Presentation
        BRP[BookSearchResultPage]
        BAP[bookAvailabilityProvider]
        RLP[registeredLibrariesProvider]
    end

    subgraph Domain
        LR[LibraryRepository]
        BA[BookAvailability]
        LS[LibraryStatus]
        AS[AvailabilityStatus]
    end

    subgraph Data
        CRI[CalilRepositoryImpl]
        CAC[CalilApiClient]
    end

    BRP --> BAP
    BRP --> RLP
    BAP --> LR
    LR --> CRI
    CRI --> CAC
    BA --> LS
    LS --> AS
```

## Component Design

### BookSearchResultPage

蔵書検索結果を表示するメインページ。

```mermaid
classDiagram
    class BookSearchResultPage {
        +String isbn
        +build(context, ref) Widget
        -_buildLoadingState() Widget
        -_buildErrorState(error, retry) Widget
        -_buildResultState(availabilities) Widget
        -_buildNoLibraryState() Widget
    }

    class LibraryAvailabilityCard {
        +Library library
        +LibraryStatus status
        +build(context) Widget
    }

    class AvailabilityStatusBadge {
        +AvailabilityStatus status
        +build(context) Widget
    }

    BookSearchResultPage --> LibraryAvailabilityCard
    LibraryAvailabilityCard --> AvailabilityStatusBadge
```

### Provider設計

```dart
// ISBN を受け取り、登録図書館の蔵書状況を検索する
final bookAvailabilityProvider = FutureProvider.family<List<BookAvailability>, String>(
  (ref, isbn) async {
    final libraries = await ref.watch(registeredLibrariesProvider.future);
    final systemIds = libraries.map((l) => l.systemId).toSet().toList();
    if (systemIds.isEmpty) return [];

    final repository = ref.watch(libraryRepositoryProvider);
    return repository.checkBookAvailability(
      isbn: [isbn],
      systemIds: systemIds,
    );
  },
);
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Page as BookSearchResultPage
    participant Provider as bookAvailabilityProvider
    participant RegLib as registeredLibrariesProvider
    participant Repo as LibraryRepository
    participant API as CalilApiClient

    User->>Page: navigate to /result/:isbn
    Page->>Provider: watch(bookAvailabilityProvider(isbn))
    Provider->>RegLib: get registered libraries
    RegLib-->>Provider: List<Library>
    Provider->>Repo: checkBookAvailability(isbn, systemIds)
    Repo->>API: checkAvailability (polling)

    loop continue == 1
        API-->>Repo: CheckResponse (partial)
        Note over API,Repo: Polling with session
    end

    API-->>Repo: CheckResponse (complete)
    Repo-->>Provider: List<BookAvailability>
    Provider-->>Page: AsyncValue<List<BookAvailability>>
    Page->>User: Display results
```

## Domain Models（既存）

以下のモデルは既に実装済み:

- `BookAvailability`: ISBN + 図書館ステータスのマップ
- `LibraryStatus`: systemId + AvailabilityStatus + 予約URL + libKey別ステータス
- `AvailabilityStatus`: enum (available, checkedOut, notFound, etc.)
- `Library`: 図書館情報（systemId, formalName, address, etc.）

## UI Design

### 検索結果画面レイアウト

design-guidelines.md セクション 2.5 に準拠:

- AppBar: 「検索結果」+ 戻るボタン
- ISBN 表示エリア
- 蔵書状況セクション: 登録図書館ごとのカード
- 各カード: 図書館名 + 蔵書状態バッジ（セマンティックカラー）+ 予約リンク
- 「別の本をスキャンする」ボタン

### セマンティックカラー

| 状態 | 色 | AvailabilityStatus |
|------|-----|-------------------|
| 貸出可能 | Green (#2E7D32) | available |
| 館内のみ | Green (#2E7D32) | inLibraryOnly |
| 貸出中 | Orange (#EF6C00) | checkedOut |
| 予約中 | Orange (#EF6C00) | reserved |
| 蔵書なし | Gray (#9E9E9E) | notFound |
| エラー | Red (#D32F2F) | error |

## Routing

```
/result/:isbn → BookSearchResultPage(isbn: isbn)
```

app_router.dart に GoRoute を追加する。
