# Issue #32: E2Eテスト・リリースビルド — 要件定義

## Problem Statement

現状は unit テスト・widget テストのみで、Integration テスト（E2Eテスト）が存在しない。また Android リリースビルドの設定がデフォルトのままで、リリース準備が整っていない。

## Requirements

### Functional Requirements

1. **Integration テストの追加**: 主要なユーザーフローをカバーする Integration テストを作成する
   - アプリ起動 → ホームページ表示
   - 底部ナビゲーションバーでのタブ切り替え
   - ISBN手動入力フロー（バーコードスキャンはカメラが必要なためスキップ）
2. **Android リリースビルド設定**:
   - `applicationId` をプロジェクト固有のものに変更
   - バージョン情報の整理
   - ProGuard/R8 shrink の確認

### Non-Functional Requirements

1. Integration テストが CI で実行可能であること（ヘッドレスモードで可能な範囲）
2. `flutter build apk` が正常に完了すること

## Constraints

- Integration テストはカメラやネットワークに依存しない範囲に限定する
- 署名キーの生成はスコープ外（デバッグ署名で代替）

## Acceptance Criteria

1. `integration_test/` ディレクトリに E2E テストが存在する
2. `flutter build apk` がエラーなく完了する
3. 全テスト（unit + widget + integration）が通ること
