# タスクチェックリスト: バーコードスキャン画面に戻るとカメラが起動しないバグ修正 (#23)

## 実装タスク

- [x] Task 1: `_navigateToResult()`でpush後のFutureコールバックを追加
  - `_isProcessing = false` と `_controller.start()` を実行

- [x] Task 2: 全テスト実行・確認

NOTE: `_navigateToResult`はprivateメソッドで`MobileScanner`（ネイティブプラグイン）経由でのみ呼ばれるため、ウィジェットテストでカメラ再起動フローを直接テストすることは困難。手動テストで動作確認済み。
