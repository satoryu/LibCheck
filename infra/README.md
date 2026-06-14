# infra — Bicep による IaC

LibCheck の Azure リソースを [Bicep](https://learn.microsoft.com/azure/azure-resource-manager/bicep/) で管理する。Issue #75。

## 管理対象

| リソース | 種別 | 備考 |
|---|---|---|
| `rg-libcheck` | リソースグループ（`eastasia`） | `main.bicep`（subscription scope）で作成 |
| `libcheck` | Static Web App（sku Free） | `modules/staticWebApp.bicep` |
| `CALIL_APP_KEY` | SWA アプリ設定（シークレット） | `appsettings` 子リソース。値は注入（後述） |

> アプリ（フロントエンド）の配信は別系統。既存の GitHub Actions（`.github/workflows/azure-static-web-apps.yml`、デプロイトークン方式）が担う。Bicep は **インフラ構成のみ** を管理し、配信ワークフローには干渉しない。

## ファイル構成

```
infra/
  main.bicep              # targetScope='subscription'：RG 作成 + モジュール呼び出し
  main.bicepparam         # パラメータ（calilAppKey は環境変数から注入）
  modules/
    staticWebApp.bicep    # SWA 本体 + appsettings 子リソース
  README.md               # このファイル
```

## 前提

- Azure CLI（`az`）にログイン済みで、対象サブスクリプションが選択されていること
  ```bash
  az login
  az account show   # 対象サブスクリプションを確認
  ```
- Bicep CLI（`az` に同梱。未導入なら `az bicep install`）
- シークレット `CALIL_APP_KEY` を環境変数で渡せること（リポジトリには置かない）
  ```bash
  # 例: ローカルの api/local.settings.json から取り出す（値は表示しない）
  export CALIL_APP_KEY="$(python3 -c "import json;print(json.load(open('api/local.settings.json'))['Values']['CALIL_APP_KEY'])")"
  ```

## デプロイスコープ

リソースグループスコープでデプロイする（最小権限）。リソースグループ `rg-libcheck`
は一度きりのブートストラップで作成済み（IaC では作成しない）。

```bash
# ブートストラップ（初回のみ・作成済み）
az group create --name rg-libcheck --location eastasia
```

## 手動デプロイ手順（CI でも同じコマンドを使う）

> 以下の `what-if` / `create` の 2 コマンドが手動・CI 共通の中核。CI では「`az login` を OIDC に置き換える」「`CALIL_APP_KEY` を GitHub Secret から渡す」だけで同じコマンドを使う（`.github/workflows/infra.yml`）。

### 1. ビルド / リント

```bash
az bicep build --file infra/main.bicep
```

### 2. what-if（差分プレビュー・適用前に必須）

```bash
az deployment group what-if \
  --resource-group rg-libcheck \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam
```

- 既存リソースに対して **破壊的変更が無い**（差分なし、または意図した差分のみ）ことを確認する。
- `CALIL_APP_KEY` は `@secure()` のため what-if 出力では値がマスクされる。

### 3. apply（適用）

```bash
az deployment group create \
  --resource-group rg-libcheck \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam
```

## what-if の残差（無害なノイズ）について

既存 SWA に対する `what-if` では、以下が差分として表示されるが**いずれも無害**：

- `properties.stableInboundIP` / `properties.trafficSplitting` … サーバー側で計算・既定設定される読み取り専用相当の値。テンプレートでは制御せず、Azure が再設定する（what-if の既知の false positive ノイズ）。
- `properties.deploymentAuthPolicy: "DeploymentToken"` … 省略しても apply 後に既定値 `DeploymentToken` に戻り同値。明示するには未定義プロパティ（BCP037）になるため設定しない。
- `config/appsettings` … `x Unsupported`。SWA の appsettings は GET 非対応のため what-if で差分プレビューできない。`CALIL_APP_KEY` を毎回渡すため、適用後は現行と同じ単一キー構成になる。

`provider` / `repositoryUrl` / `branch` は既存値を再表明しているため差分なし。settable で意味のあるプロパティが失われないことを確認済み。

## 注意・冪等性

- SWA の `appsettings` は **ARM 上で全置換**。よってデプロイ時は毎回 `CALIL_APP_KEY` を渡すこと。
  未設定だと `main.bicepparam` の `readEnvironmentVariable('CALIL_APP_KEY')` がエラーになり気づける。
- 既存リソースと同名・同 location・同 SKU を宣言するため、`create` は in-place 更新（冪等）。
- 初回適用前は必ず `what-if` で差分を確認すること。

## CI 自動適用（`.github/workflows/infra.yml`）

OIDC（パスワードレス）で Azure にログインして適用する。アプリ配信ワークフロー
（azure-static-web-apps.yml）とは責務を分離している。

| トリガー | 動作 |
|---|---|
| `pull_request`（`infra/**`） | **what-if** のみ（差分プレビュー・読み取り） |
| `push: main`（`infra/**`） | **apply**（`production` 環境の承認ゲート経由） |
| `workflow_dispatch` | **apply**（同上・初回/再適用/手動） |

`production` 環境に **required reviewers** を設定しているため、main 反映後も承認操作を
してから apply が実行される（本番リソースの誤適用防止）。

### 一度きりのセットアップ（実施済み・再現用メモ）

```bash
# 1) GitHub OIDC 用の App 登録 + サービスプリンシパル
az ad app create --display-name libcheck-github-oidc          # → appId(=AZURE_CLIENT_ID)
az ad sp create --id <appId>

# 2) フェデレーション資格情報（トリガーごとに subject を登録）
#    - PR の what-if 用 : repo:satoryu/LibCheck:pull_request
#    - apply 用(環境)   : repo:satoryu/LibCheck:environment:production
az ad app federated-credential create --id <appId> --parameters '{
  "name":"github-pull-request","issuer":"https://token.actions.githubusercontent.com",
  "subject":"repo:satoryu/LibCheck:pull_request","audiences":["api://AzureADTokenExchange"]}'
az ad app federated-credential create --id <appId> --parameters '{
  "name":"github-env-production","issuer":"https://token.actions.githubusercontent.com",
  "subject":"repo:satoryu/LibCheck:environment:production","audiences":["api://AzureADTokenExchange"]}'

# 3) 最小権限のロール割当（rg-libcheck のみ）
az role assignment create --assignee <appId> --role Contributor \
  --scope /subscriptions/<subId>/resourceGroups/rg-libcheck

# 4) GitHub 側: Secrets と Environment
gh secret set AZURE_CLIENT_ID --body <appId>
gh secret set AZURE_TENANT_ID --body <tenantId>
gh secret set AZURE_SUBSCRIPTION_ID --body <subId>
gh secret set CALIL_APP_KEY --body <calil-app-key>     # @secure() パラメータへ
# production 環境 + required reviewers は gh api で作成済み
```

> シークレットは GitHub Secrets に保存し、ワークフローでは `env:` 経由で `@secure()` パラメータへ渡す。OIDC のためクライアントシークレット（パスワード）は発行しない。
