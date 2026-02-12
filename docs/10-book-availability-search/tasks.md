# Issue #10: 蔵書検索・結果表示 - 実装タスク

## Tasks

- [x] Task 1: bookAvailabilityProvider の作成
  - FutureProvider.family<List<BookAvailability>, String> を実装
  - registeredLibrariesProvider から systemIds を取得
  - LibraryRepository.checkBookAvailability を呼び出し
  - テスト: 正常系、図書館未登録時、エラー時

- [x] Task 2: AvailabilityStatusBadge ウィジェットの作成
  - AvailabilityStatus に応じたセマンティックカラーバッジ
  - 状態テキスト（貸出可能、貸出中、蔵書なし等）の表示
  - テスト: 各状態の色・テキスト表示

- [x] Task 3: LibraryAvailabilityCard ウィジェットの作成
  - 図書館名、蔵書状態バッジ、予約URLリンクを表示
  - テスト: 各状態のカード表示、予約URLリンクの有無

- [x] Task 4: BookSearchResultPage の作成
  - ローディング状態、エラー状態、結果状態、図書館未登録状態の表示
  - ISBN 表示エリア
  - 「別の本をスキャンする」ボタン
  - テスト: 各状態の表示、ボタン動作

- [x] Task 5: ルーティングの追加
  - app_router.dart に `/result/:isbn` ルートを追加
  - テスト: ルーティングテスト
