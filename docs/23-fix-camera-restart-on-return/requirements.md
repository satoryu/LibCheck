# 要件定義: バーコードスキャン画面に戻るとカメラが起動しないバグ修正 (#23)

## Problem Statement

検索結果ページから「別の本をスキャンする」でスキャン画面に戻ると、カメラが起動せず画面が暗いまま。

バーコード検出時に`_controller.stop()`でカメラを停止し`_isProcessing = true`を設定するが、`push`で遷移した場合ウィジェットはツリーに残るため、`pop`で戻っても`initState()`が呼ばれず、カメラもフラグもリセットされない。

## Requirements

### Functional Requirements

- FR-1: 検索結果ページから戻った際にカメラが自動的に再起動すること
- FR-2: 再起動後、バーコードの検出が正常に機能すること

### Non-Functional Requirements

- NFR-1: 既存のテストが引き続きパスすること
- NFR-2: 修正に対するテストを追加すること

## Constraints

- MobileScannerControllerのAPIに準拠すること

## Acceptance Criteria

- AC-1: スキャン→検索結果→戻る→カメラが起動して次のバーコードをスキャンできる
- AC-2: すべてのテストがパスする

## User Stories

- US-1: ユーザーとして、複数の本を連続してスキャンしたい。
