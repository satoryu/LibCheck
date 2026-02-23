# Requirements: GitHub Actionsで署名付きAABをビルドしGitHub Releaseにアップロード

## Problem Statement

現在のCI/CDパイプラインにはanalyzeとtestのみが含まれており、Google Play Storeへのリリースに必要な署名付きAndroid App Bundle (.aab) を生成する仕組みがない。リリースのたびに手動でビルド・署名する必要があり、ヒューマンエラーのリスクやリリースプロセスの属人化が課題となっている。

## Requirements

### Functional Requirements

1. **署名設定の追加**: Androidプロジェクトにリリース用の署名設定を追加する
2. **AABビルドワークフロー**: GitHub Actionsで署名付きAAB (.aab) をビルドするワークフローを作成する
3. **トリガー**: Gitタグ (`v*.*.*` 形式) のプッシュ、または手動実行 (workflow_dispatch) でワークフローを起動できる
4. **GitHub Release**: ビルドしたAABをGitHub Releaseに自動的に添付する
5. **バージョン管理**: タグのバージョン番号をビルドに反映する

### Non-Functional Requirements

1. **セキュリティ**: キーストアやパスワード等の機密情報はGitHub Secretsで管理し、リポジトリにコミットしない
2. **再現性**: 同じタグから常に同じビルドが生成できること
3. **保守性**: ワークフローはシンプルで理解しやすい構成にする

## Constraints

- Google Playへのアップロードは手動で行う（Phase 1）
- キーストアはアップロード用キーストア（Google Play App Signingを使用する前提）
- GitHub Actions の ubuntu-latest ランナーを使用する
- Flutter stable チャネルを使用する

## Acceptance Criteria

1. `v*.*.*` 形式のタグをプッシュすると、GitHub Actionsが自動的に署名付きAABをビルドする
2. ビルドされたAABがGitHub Releaseに添付される
3. workflow_dispatch で手動実行した場合も同様にビルド・リリースが行われる
4. キーストアやパスワードがリポジトリに含まれていない
5. `android/app/build.gradle.kts` にリリース用の署名設定が正しく記述されている
6. キーストアの作成手順がドキュメント化されている

## User Stories

1. **開発者として**、Gitタグをプッシュするだけで署名付きAABが生成されるようにしたい。手動ビルドの手間とミスを減らすため。
2. **開発者として**、GitHub ReleaseからAABをダウンロードして Google Play Console にアップロードしたい。リリース成果物を一元管理するため。
3. **開発者として**、手動でワークフローを実行して任意のタイミングでAABを生成したい。テスト配布等の柔軟な運用のため。
