# Issue #8: ISBNバーコードスキャン - 実装タスク

## Tasks

- [x] Task 1: IsbnValidator ユーティリティの作成
  - ISBN-13 チェックディジット検証
  - ISBN-10 チェックディジット検証
  - 正規化（ハイフン除去）
  - テスト: 有効/無効なISBN-13、ISBN-10、境界値

- [x] Task 2: mobile_scanner パッケージ導入と設定
  - pubspec.yaml に mobile_scanner 追加
  - AndroidManifest.xml にカメラ権限追加
  - 動作確認

- [x] Task 3: ScanOverlayWidget の作成
  - 半透明オーバーレイ + スキャンガイド枠
  - テスト: ウィジェットが正しくレンダリングされる

- [x] Task 4: BarcodeScannerPage の作成
  - MobileScannerController の管理
  - カメラプレビュー表示
  - バーコード検出時の ISBN バリデーション
  - フラッシュライト切替
  - 読み取り成功時の遷移
  - 手動入力への遷移リンク
  - テスト: UI構成要素の表示、バーコード検出コールバック

- [x] Task 5: カメラ権限エラーハンドリング
  - 権限拒否時のエラー画面
  - 「設定を開く」ボタン
  - 「ISBNを手動入力する」ボタン
  - テスト: エラー画面の表示

- [x] Task 6: ルーティングの追加
  - app_router.dart に `/scan` ルートを追加
  - テスト: ルーティングテスト
