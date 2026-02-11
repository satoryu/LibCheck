# Issue #9: 都道府県・市区町村選択UI - タスクリスト

## Tasks

- [x] 1. go_router パッケージの追加と `MaterialApp.router` への移行
  - go_router を pubspec.yaml に追加
  - `lib/presentation/router/app_router.dart` にルート定義を作成
  - `lib/app.dart` を `MaterialApp.router` に変更
  - 既存テストの修正

- [x] 2. 都道府県静的データの作成
  - `lib/domain/data/japanese_prefectures.dart` に `RegionGroup` クラスと `JapanesePrefectures` クラスを実装
  - 47都道府県を7つの地方ブロックにグループ化
  - ユニットテスト作成

- [x] 3. 市区町村一覧取得プロバイダーの実装
  - `lib/presentation/providers/city_providers.dart` に `cityListProvider` を実装
  - カーリルAPIの `/library` レスポンスから `city` フィールドを抽出・重複排除・ソート
  - ユニットテスト作成

- [x] 4. 都道府県選択画面の実装
  - `lib/presentation/pages/prefecture_selection_page.dart` の実装
  - 地方ブロックごとのグループ化表示
  - 検索フィルター機能
  - ウィジェットテスト作成

- [x] 5. 市区町村選択画面の実装
  - `lib/presentation/pages/city_selection_page.dart` の実装
  - `cityListProvider` を使った非同期データ表示（ローディング・エラー状態を含む）
  - 検索フィルター機能
  - ウィジェットテスト作成

- [x] 6. ルーティングの統合とE2E動作確認
  - 都道府県 → 市区町村の遷移テスト
  - 戻るナビゲーションのテスト
  - 全テストがパスすることの確認
