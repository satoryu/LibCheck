# Issue #38: バーコードスキャン画面でカメラ映像が真っ白になる — 要件定義

## Problem Statement

バーコードスキャン画面でカメラ映像が真っ白になることがある。エラー画面は表示されず、ガイド枠は正常に表示されているが、カメラプレビュー部分が空白になる。原因は `MobileScannerController` の `autoStart: true`（デフォルト）と手動の `_startCamera()` による二重起動の競合。

## Requirements

### Functional Requirements

1. カメラ起動を一箇所に統一し、二重起動の競合を排除する
2. カメラプレビューが正常に表示される

### Non-Functional Requirements

1. 既存の機能（バーコード検出、フラッシュ切替、エラーハンドリング）に影響を与えない

## Constraints

- `mobile_scanner` パッケージ v6.0.11 の `autoStart` パラメータを利用する

## Acceptance Criteria

1. バーコードスキャン画面でカメラ映像が正常に表示される
2. 繰り返し画面遷移しても真っ白にならない
3. 全テストが通る
