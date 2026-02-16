# Issue #42: 蔵書なし・休館中等のステータスでも「予約する」リンクが表示される

## Problem Statement

`LibraryAvailabilityCard` で `reserveUrl` が存在すれば蔵書の状態に関わらず「予約する」リンクが表示される。蔵書がない、休館中、エラー等のステータスでは予約が意味をなさないため、リンクを非表示にすべき。

## Requirements

### Functional Requirements

- 以下のステータスの場合のみ「予約する」リンクを表示する:
  - `available`（貸出可能）
  - `inLibraryOnly`（館内のみ）
  - `checkedOut`（貸出中）
  - `reserved`（予約中）
  - `preparing`（準備中）
- 以下のステータスの場合は「予約する」リンクを非表示にする:
  - `notFound`（蔵書なし）
  - `closed`（休館中）
  - `error`（エラー）
  - `unknown`（不明）

### Non-Functional Requirements

- ステータスに基づく予約可否の判定ロジックをドメイン層（`AvailabilityStatus`）に配置する

## Constraints

- `reserveUrl` はシステムレベルの値であり、個別図書館（libKey）レベルのステータスと組み合わせて判定する必要がある

## Acceptance Criteria

1. `AvailabilityStatus` に予約リンク表示可否を判定するプロパティが追加されること
2. `LibraryAvailabilityCard` が個別図書館のステータスに基づいて「予約する」リンクの表示/非表示を制御すること
3. 予約不可なステータスで `reserveUrl` が存在しても「予約する」リンクが表示されないこと
4. 既存のテストがすべてパスすること

## User Stories

- ユーザーとして、蔵書がない図書館に「予約する」リンクが表示されないことで、無意味な予約操作を避けたい
