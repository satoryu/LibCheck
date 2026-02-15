# Issue #36: バーコードスキャン画面のエラーハンドリング修正 — 要件定義

## Problem Statement

バーコードスキャン画面で `MobileScannerController.start()` のエラーをすべてカメラ権限エラーとして扱っているため、カメラ権限が許可済みでもプラットフォーム起因の一般エラーが発生すると「設定を開く」画面が表示されてしまう。

## Requirements

### Functional Requirements

1. カメラ権限が拒否された場合のみ、権限エラー画面（「設定を開く」ボタン）を表示する
2. 権限拒否以外のエラー（`genericError`、`controllerAlreadyInitialized` 等）の場合は、リトライ可能なエラー画面を表示する
3. 結果画面からの復帰時にカメラ再起動が失敗した場合も、適切にエラーハンドリングする

### Non-Functional Requirements

1. 既存のカメラ権限エラー画面の見た目は変更しない
2. テストで各エラーパターンを検証できる

## Constraints

- `mobile_scanner` パッケージ v6.0.11 の API に準拠する
- `MobileScannerException` と `MobileScannerErrorCode` を利用してエラー種別を判別する

## Acceptance Criteria

1. カメラ権限拒否時に「設定を開く」画面が表示される
2. 権限拒否以外のエラー時にリトライボタン付きのエラー画面が表示される
3. リトライボタンを押すとカメラ起動を再試行する
4. 全テストが通る
