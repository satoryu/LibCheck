# Issue #25: 検索履歴の保存 — タスク一覧

## Implementation Tasks

- [x] 1. `SearchHistoryEntry` ドメインモデルの作成（JSON シリアライズ/デシリアライズ含む）
- [x] 2. `SearchHistoryRepository` インターフェースの作成
- [x] 3. `SearchHistoryRepositoryImpl` の実装（SharedPreferences を使用した永続化）
- [x] 4. 検索履歴の Riverpod Provider（`SearchHistoryNotifier`）の作成
- [x] 5. `BookSearchResultPage` で検索完了時に履歴を自動保存する処理の追加
- [x] 6. 全テストの実行と flutter analyze の確認
