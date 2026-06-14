# 在庫状況順ソート — Design

## Architecture Overview

表示順のみの変更。純粋関数 `sortLibrariesByAvailability` を presentation/utils に追加し、`BookSearchResultPage` の描画箇所で登録図書館配列を並べ替えてから map する。ドメインの既存ロジック（`statusForLibKey`・`availabilityPriority`）を再利用する。

```mermaid
flowchart LR
  Page[BookSearchResultPage.resultState] -->|libraries, result| Sort[sortLibrariesByAvailability]
  Sort -->|per-lib status| SFL[statusForLibKey]
  Sort -->|priority| AP[availabilityPriority]
  Sort -->|降順ソート済み Library[]| Map[libraries.map → LibraryAvailabilityCard]
```

## Component Design

### `src/presentation/utils/sortLibrariesByAvailability.ts`（新規・純粋関数）
- 入力: `libraries: Library[]`, `result: BookAvailability | undefined`
- 各館の表示ステータスを `statusForLibKey(result.libraryStatuses[systemId], libKey)` で求め、`availabilityPriority` 降順でソート。
- 元配列はコピー（`[...libraries]`）してから `sort` し、ミューテートを避ける。`Array.prototype.sort` は安定なので同順位は登録順維持。
- result が無い／result に当該 systemId が無い館は `AvailabilityStatus.unknown`（優先度0=最下位）扱い。

### `src/presentation/pages/BookSearchResultPage.tsx`（改修）
- `resultState` 内の `libraries.map(...)` を `sortLibrariesByAvailability(libraries, result).map(...)` に置換。
- カードの `status`・`key` 計算は現状維持。

## Data Flow
1. `resultState(libraries, results)` が `result = findResultForIsbn(results)` を取得（既存）。
2. `sortLibrariesByAvailability(libraries, result)` で表示用に並べ替え。
3. 並べ替え後の配列を map して `LibraryAvailabilityCard` を描画。

## Domain Models
新規モデルなし。既存の `Library` / `BookAvailability` / `LibraryStatus` / `AvailabilityStatus` を利用。

## 設計上の判断
- 優先度は既存 `availabilityPriority`（available > 館内のみ > 貸出中 > 予約中 > 準備中 > 休館中 > 蔵書なし > error > unknown）をそのまま採用。利用者の「貸出可能・蔵書ありを上位に」を満たしつつ、全体として在庫がある館を上に集める自然な並びになる。
- ソートは表示順のみ。検索履歴保存（`statuses` の組み立て）には一切手を加えない。
