# Design: GitHub Actionsで署名付きAABをビルドしGitHub Releaseにアップロード

## Architecture Overview

リリースプロセスは以下のコンポーネントで構成される。

```mermaid
flowchart LR
    A[Developer] -->|git tag v*.*.*| B[GitHub]
    B -->|trigger| C[GitHub Actions]
    C -->|build| D[Signed AAB]
    D -->|upload| E[GitHub Release]
    E -->|manual download| F[Google Play Console]
```

## Component Design

### 1. Android署名設定

`android/app/build.gradle.kts` にリリース用の署名設定を追加する。
`key.properties` ファイルから署名情報を読み込む構成とし、ローカルビルドとCI環境の両方に対応する。

```mermaid
flowchart TD
    A[build.gradle.kts] -->|reads| B[key.properties]
    B -->|references| C[upload-keystore.jks]
    D[GitHub Secrets] -->|CI: decoded to| C
    D -->|CI: written to| B
```

#### key.properties のフォーマット

```properties
storePassword=<password>
keyPassword=<password>
keyAlias=upload
storeFile=<path-to-keystore>/upload-keystore.jks
```

#### build.gradle.kts の変更

- `key.properties` を読み込む処理を追加
- `signingConfigs` に `release` 設定を追加
- `buildTypes.release` で `release` 署名設定を使用

### 2. GitHub Actions ワークフロー (`release-android.yml`)

```mermaid
flowchart TD
    A[Trigger: tag push / manual] --> B[Checkout]
    B --> C[Setup Java 17]
    C --> D[Setup Flutter]
    D --> E[Decode Keystore from Secret]
    E --> F[Create key.properties]
    F --> G[flutter pub get]
    G --> H[flutter build appbundle --release]
    H --> I[Create GitHub Release]
    I --> J[Upload AAB to Release]
```

#### トリガー設定

- **タグプッシュ**: `v*.*.*` パターンにマッチするタグ
- **手動実行**: `workflow_dispatch` で `version` パラメータを入力可能

#### GitHub Secrets

| Secret名 | 内容 |
|-----------|------|
| `KEYSTORE_BASE64` | キーストアファイルをBase64エンコードした値 |
| `KEYSTORE_PASSWORD` | キーストアのパスワード |
| `KEY_ALIAS` | キーのエイリアス名 |
| `KEY_PASSWORD` | キーのパスワード |

### 3. キーストア作成手順

`keytool` コマンドでアップロード用キーストアを作成する。

```bash
keytool -genkey -v \
  -keystore upload-keystore.jks \
  -storetype JKS \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias upload
```

## Data Flow

### タグプッシュ時のフロー

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant GA as GitHub Actions
    participant GR as GitHub Release

    Dev->>GH: git push tag v1.0.0
    GH->>GA: Trigger release-android workflow
    GA->>GA: Checkout code
    GA->>GA: Setup Java 17 + Flutter
    GA->>GA: Decode keystore from KEYSTORE_BASE64
    GA->>GA: Create key.properties from secrets
    GA->>GA: flutter build appbundle --release
    GA->>GR: Create release "v1.0.0"
    GA->>GR: Upload app-release.aab
    Dev->>GR: Download AAB
    Dev->>Dev: Upload to Google Play Console
```

### 手動実行時のフロー

手動実行時は `workflow_dispatch` のインプットからバージョン情報を取得し、同様のフローでビルド・リリースを行う。

## Domain Models

このIssueでは新しいドメインモデルの追加はない。CI/CDインフラストラクチャの変更のみ。

### 変更対象ファイル

| ファイル | 変更内容 |
|----------|----------|
| `android/app/build.gradle.kts` | リリース署名設定の追加 |
| `.github/workflows/release-android.yml` | 新規: リリースワークフロー |
| `.gitignore` | `key.properties`, `*.jks` の追加 |
| `android/.gitignore` | `key.properties` の追加 |
