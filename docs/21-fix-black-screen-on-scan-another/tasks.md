# タスクチェックリスト: 「別の本をスキャンする」ボタンで画面が真っ黒になるバグ修正 (#21)

## 実装タスク

- [x] Task 1: `BarcodeScannerPage`の遷移テストを追加
  - `_navigateToResult`が`push`で遷移することを確認するテスト

- [x] Task 2: `BarcodeScannerPage._navigateToResult()`を`go`から`push`に変更

- [x] Task 3: 全テスト実行・確認
  - `flutter test` ですべてのテストがパスすることを確認
