# Issue #9: ISBN手動入力 - 実装タスク

## Tasks

- [ ] Task 1: IsbnValidator に getValidationMessage メソッド追加
  - 入力途中は null（エラー非表示）
  - 有効な ISBN は null
  - 無効な ISBN はエラーメッセージ文字列を返す
  - テスト: 各パターンのバリデーションメッセージ

- [ ] Task 2: IsbnInputPage の作成
  - TextEditingController + リアルタイムバリデーション
  - 有効時の表示（「有効なISBNです」）
  - エラー時の表示（エラーメッセージ）
  - 検索ボタン（有効時のみ enabled）
  - バーコードスキャンへの遷移ボタン
  - テスト: 各状態のUI表示、ボタン有効/無効、遷移

- [ ] Task 3: ルーティングの追加
  - app_router.dart に `/isbn-input` ルートを追加
  - テスト: ルーティングテスト
