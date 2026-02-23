# Tasks: GitHub Actionsで署名付きAABをビルドしGitHub Releaseにアップロード

## Implementation Tasks

- [x] 1. `.gitignore` にキーストアと `key.properties` を追加する（既に設定済み）
- [x] 2. `android/app/build.gradle.kts` にリリース用署名設定を追加する
- [x] 3. `.github/workflows/release-android.yml` を作成する
  - [x] 3.1. トリガー設定（タグプッシュ + workflow_dispatch）
  - [x] 3.2. Flutter / Java セットアップ
  - [x] 3.3. キーストアのデコードと key.properties の生成
  - [x] 3.4. 署名付きAABのビルド
  - [x] 3.5. GitHub Release の作成とAABのアップロード
- [x] 4. キーストア作成・Secrets設定手順をドキュメント化する
- [ ] 5. ワークフローの動作確認（キーストア作成・Secrets設定後に実施）
