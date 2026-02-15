# Issue #32: E2Eテスト・リリースビルド — 設計

## Architecture Overview

Integration テストは `integration_test/` ディレクトリに配置し、`flutter_test` と `integration_test` パッケージを使用する。

## Component Design

### Integration テスト構成

```
integration_test/
  app_test.dart       # メインのE2Eテストファイル
```

### テストシナリオ

1. **アプリ起動テスト**: アプリが正常に起動し、ホームページが表示される
2. **タブナビゲーションテスト**: BottomNavigationBar でホーム・図書館・履歴タブを切り替えられる
3. **ISBN手動入力テスト**: ISBN入力画面に遷移し、ISBNを入力できる

### Android リリースビルド設定

- `applicationId`: `com.example.libcheck` → `dev.satoryu.libcheck` に変更
- `description`: `pubspec.yaml` のプロジェクト説明を更新

## Data Flow

E2Eテストでは実際のアプリを起動するが、ネットワーク通信はモックしない。テストは UI 操作のみで検証する。

## Domain Models

変更なし。
