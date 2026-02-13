# 設計: 蔵書状況の表示バグ修正 (#19)

## Architecture Overview

現在のデータフローでは、カーリルAPIから取得した分館（libKey）ごとのステータスが`LibraryStatus.libKeyStatuses`に保存されているが、表示時にはシステム全体の集約ステータス（`LibraryStatus.status`）のみが使用されている。

本修正では、`LibraryStatus`に分館ごとのステータスを取得するメソッドを追加し、`LibraryAvailabilityCard`がそれを利用するように変更する。

## Component Design

### LibraryStatus モデル（修正）

```mermaid
classDiagram
    class LibraryStatus {
        +String systemId
        +AvailabilityStatus status
        +String? reserveUrl
        +Map~String, String~ libKeyStatuses
        +statusForLibKey(String libKey) AvailabilityStatus
    }
    class AvailabilityStatus {
        <<enum>>
        +available
        +inLibraryOnly
        +checkedOut
        +reserved
        +preparing
        +closed
        +notFound
        +error
        +unknown
        +fromApiString(String value)$ AvailabilityStatus
        +aggregate(List~AvailabilityStatus~ statuses)$ AvailabilityStatus
    }
    LibraryStatus --> AvailabilityStatus
```

`statusForLibKey(String libKey)` メソッド:
- `libKeyStatuses`マップからlibKeyに対応するAPI文字列を取得
- `AvailabilityStatus.fromApiString()`で変換して返す
- libKeyが存在しない場合は`AvailabilityStatus.notFound`を返す

### LibraryAvailabilityCard ウィジェット（修正）

```mermaid
flowchart TD
    A[LibraryAvailabilityCard] --> B{status.statusForLibKey\nlibrary.libKey}
    B --> C[AvailabilityStatusBadge]
```

変更前: `AvailabilityStatusBadge(status: status.status)`
変更後: `AvailabilityStatusBadge(status: status.statusForLibKey(library.libKey))`

## Data Flow

```mermaid
sequenceDiagram
    participant API as カーリルAPI
    participant Client as CalilApiClient
    participant Model as LibraryStatus
    participant Card as LibraryAvailabilityCard
    participant Badge as AvailabilityStatusBadge

    API->>Client: libkey: {"みなと": "貸出可", "しば": "貸出中"}
    Client->>Model: libKeyStatuses = {"みなと": "貸出可", "しば": "貸出中"}
    Card->>Model: statusForLibKey("みなと")
    Model-->>Card: AvailabilityStatus.available
    Card->>Badge: status: available
    Note over Badge: 「貸出可能」を表示

    Card->>Model: statusForLibKey("しば")
    Model-->>Card: AvailabilityStatus.checkedOut
    Card->>Badge: status: checkedOut
    Note over Badge: 「貸出中」を表示
```

## Domain Models

変更対象のドメインモデルは`LibraryStatus`のみ。メソッド追加であり、既存フィールドへの変更はなし。
