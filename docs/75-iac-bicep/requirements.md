# インフラの IaC 化（Bicep） — Requirements

Issue: #75

## Problem Statement

現在 Azure のリソースは `az staticwebapp create` 等で手動作成されており、構成がコードに残っていない。今後 DB（#74）や効果測定（Application Insights, #76）などリソースが増えるため、インフラを **Bicep** でコード管理し、再現・追跡・拡張できるようにする。

現状（実機確認済み）:
- リソースグループ: `rg-libcheck`（`eastasia`）
- Static Web App: `libcheck`（sku **Free**、`East Asia`、GitHub 連携、hostname `gray-mushroom-05e69e400.7.azurestaticapps.net`）
- アプリ設定: `CALIL_APP_KEY`（シークレット）のみ

## Requirements

### Functional
- FR-1: 既存リソース（`rg-libcheck` / SWA `libcheck` / sku Free）を Bicep で宣言的に再現できる。
- FR-2: SWA のアプリ設定 `CALIL_APP_KEY` を Bicep の管理対象に含める（`@secure()` パラメータ）。
- FR-3: `what-if`（差分プレビュー）→ `create`（適用）の手動デプロイ手順を用意する。
- FR-4: 将来リソース（DB・Application Insights 等）をモジュールとして追加しやすい構成にする。

### Non-Functional
- NFR-1: シークレット（`CALIL_APP_KEY`）の値をリポジトリに置かない。デプロイ時に環境変数 / CI Secret から注入する。
- NFR-2: 既存の本番 SWA を壊さない。適用前に必ず `what-if` で差分を確認する（誤適用防止）。
- NFR-3: 冪等であること（同じテンプレートの再適用で意図しない変更が出ない）。
- NFR-4: Bicep のビルド/リント（`az bicep build`）が通る。

## Constraints
- ARM の SWA アプリ設定（`appsettings`）は**全置換**。よってデプロイ時は毎回 `CALIL_APP_KEY` を渡す運用とする。
- 本番デプロイ（アプリ配信）は既存の GitHub Actions（デプロイトークン方式）を継続。Bicep はインフラ構成を管理し、アプリ配信ワークフローには干渉しない。
- CI 自動適用は **OIDC（パスワードレス）+ 最小権限（`rg-libcheck` の Contributor のみ）+ `production` 環境の承認ゲート**で実装する。デプロイは RG スコープ（`az deployment group`）。

## Acceptance Criteria
- AC-1: `infra/` 配下の Bicep が `az bicep build` を通る。
- AC-2: `az deployment sub what-if` を実行すると、既存リソースに対して破壊的変更が無い（差分が無い or 意図した差分のみ）ことを確認できる。
- AC-3: `CALIL_APP_KEY` を環境変数から注入する形で、値がリポジトリに含まれない。
- AC-4: README/DEPLOY 等に手動デプロイ手順と CI 自動適用（OIDC・承認ゲート・OIDCセットアップ）が記載される。
- AC-5: PR（`infra/**` 変更）で what-if ジョブが OIDC ログインしてグリーンになる。

## User Stories
- US-1: 開発者として、インフラ構成をコードで把握・再現したい。手動操作の属人性をなくしたい。
- US-2: 開発者として、新しいリソース（DB 等）を追加するとき、既存構成に倣ってモジュールを足すだけで済むようにしたい。
