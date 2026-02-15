# LibCheck

カメラでISBNのバーコードを撮影し、普段利用している図書館に蔵書があるかどうかを確認するモバイルアプリケーション。

## 対応OS

Android

## 技術スタック

- Flutter 3.x（Dart 3.x）
- [カーリル 図書館API](https://calil.jp/doc/api_ref.html)
- Riverpod（状態管理）
- GoRouter（画面遷移）
- SharedPreferences（ローカルストレージ）
- mobile_scanner（バーコード読み取り）

## プロジェクト構成

Clean Architecture に基づく3層構成。

```
lib/
├── main.dart                 # エントリーポイント
├── app.dart                  # MaterialApp 定義
├── domain/                   # ドメイン層
│   ├── models/               # ドメインモデル
│   ├── repositories/         # リポジトリインターフェース
│   ├── data/                 # ドメインデータ（都道府県等）
│   └── utils/                # ISBN バリデーション等
├── data/                     # データ層
│   ├── datasources/          # API クライアント
│   ├── repositories/         # リポジトリ実装
│   ├── models/               # レスポンスモデル
│   ├── providers/            # データ層プロバイダ
│   └── exceptions/           # カスタム例外
└── presentation/             # プレゼンテーション層
    ├── pages/                # 画面
    ├── widgets/              # 共通ウィジェット
    ├── providers/            # UI 状態プロバイダ
    ├── router/               # GoRouter 設定
    └── utils/                # エラーメッセージ解決等
```

## セットアップ

```bash
# 依存パッケージのインストール
flutter pub get
```

## テスト

```bash
# ユニットテスト・ウィジェットテスト
flutter test

# E2E テスト（実機またはエミュレータが必要）
flutter test integration_test/app_test.dart

# 静的解析
flutter analyze
```

## ビルド

```bash
# Android APK
flutter build apk

# Android App Bundle
flutter build appbundle
```

## コントリビューション

### ブランチ戦略

GitHub Flow を採用。

- `main`: プロダクションブランチ。テスト済み・レビュー済みのコードのみマージされる
- `feature/[ISSUE番号]-[短い説明]`: 機能開発用ブランチ。`main` から作成し、完了後 `main` へマージ

### 開発の流れ

1. GitHub Issue を作成、または既存の Issue を確認する
2. `main` から `feature/[ISSUE番号]-[短い説明]` ブランチを作成する
3. 実装する（テストも忘れずに）
4. `flutter test` と `flutter analyze` が通ることを確認する
5. PR を作成し、コードレビューを受ける
6. CI と Test Plan の全項目が完了したらマージする

### コーディング規約

- **アーキテクチャ**: Clean Architecture（domain / data / presentation の3層）
- **状態管理**: Riverpod の `AsyncNotifier` パターン
- **テスト**: TDD を原則とする。`flutter_test` でユニットテスト・ウィジェットテストを作成
- **静的解析**: `flutter analyze` で警告が出ない状態を維持する

### コードレビューの観点

- Correctness（正しさ）
- Readability（読みやすさ）
- Performance（性能）
- Security（安全性）
- Maintainability（保守性）

### PR のマージ条件

- CI（`flutter analyze` + `flutter test`）が通っていること
- Test Plan の全項目がチェック済みであること
- 実機確認が必要な項目はメンテナーの承認を得ること

## CI

GitHub Actions で PR 作成時・main ブランチへの push 時に以下を自動実行:

- `flutter analyze`
- `flutter test`
