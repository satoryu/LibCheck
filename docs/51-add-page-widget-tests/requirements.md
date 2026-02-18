# Issue #51: BarcodeScannerPageとIsbnInputPageのウィジェットテスト追加

## Problem Statement

`BarcodeScannerPage` のウィジェットテストは4件のみ（UI表示確認のみ）で、カメラエラーハンドリングやナビゲーションのテストが不足している。また、`CameraErrorWidget` と `CameraPermissionErrorWidget` のテストが存在しない。`IsbnInputPage` のテストは充実しているが、一部エッジケースが未カバー。

## Requirements

### Functional Requirements

- `CameraErrorWidget` のウィジェットテストを追加する（表示確認、コールバック動作）
- `CameraPermissionErrorWidget` のウィジェットテストを追加する（表示確認、コールバック動作）
- `BarcodeScannerPage` の「ISBNを手動入力する」ボタンのナビゲーションテストを追加する
- `IsbnInputPage` のエッジケーステスト（ISBN桁数エラー等）を追加する

### Non-Functional Requirements

- 既存のテストに影響を与えない
- `MobileScannerController` のモック化が困難なため、カメラ依存のテストは子ウィジェット単体テストでカバーする

## Constraints

- `MobileScannerController` はテスト環境でカメラにアクセスできないため、直接的なバーコード検出テストは対象外
- カメラエラー状態のテストは `CameraErrorWidget` / `CameraPermissionErrorWidget` の単体テストでカバーする

## Acceptance Criteria

1. `CameraErrorWidget` のテストが追加されていること（エラーメッセージ表示、再試行ボタン、手動入力ボタン）
2. `CameraPermissionErrorWidget` のテストが追加されていること（権限エラーメッセージ表示、設定ボタン、手動入力ボタン）
3. `BarcodeScannerPage` の手動入力ナビゲーションテストが追加されていること
4. `IsbnInputPage` のエッジケーステストが追加されていること
5. 全テストがパスすること

## User Stories

- 開発者として、カメラエラー時のUIが正しく動作することをテストで保証したい
- 開発者として、リグレッションを防ぐための十分なテストカバレッジを確保したい
