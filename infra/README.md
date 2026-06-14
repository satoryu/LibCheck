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

## 手動デプロイ手順（CI 化でもそのまま使えるコマンド）

> 以下の `what-if` / `create` の 2 コマンドが手動・CI 共通の中核。CI 化の際は「az login を OIDC に置き換える」「`CALIL_APP_KEY` を GitHub Secret から渡す」だけで同じコマンドを使える。

### 1. ビルド / リント

```bash
az bicep build --file infra/main.bicep
```

### 2. what-if（差分プレビュー・適用前に必須）

```bash
az deployment sub what-if \
  --location eastasia \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam
```

- 既存リソースに対して **破壊的変更が無い**（差分なし、または意図した差分のみ）ことを確認する。
- `CALIL_APP_KEY` は `@secure()` のため what-if 出力では値がマスクされる。

### 3. apply（適用）

```bash
az deployment sub create \
  --location eastasia \
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

## CI 自動適用の今後方針（#75 では未実装・整理のみ）

OIDC 整備後に GitHub Actions へ載せる。手動手順との差分は **認証** と **シークレットの渡し方** のみ。

1. **認証**: Azure AD でフェデレーション資格情報（OIDC）またはサービスプリンシパルを作成し、`AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID` を GitHub に登録。
   ```yaml
   permissions:
     id-token: write
     contents: read
   steps:
     - uses: azure/login@v2
       with:
         client-id: ${{ secrets.AZURE_CLIENT_ID }}
         tenant-id: ${{ secrets.AZURE_TENANT_ID }}
         subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
   ```
2. **what-if（PR / `infra/**` 変更時）→ apply（`main` 反映時）**:
   ```yaml
   - name: what-if
     run: az deployment sub what-if --location eastasia --template-file infra/main.bicep --parameters infra/main.bicepparam
     env:
       CALIL_APP_KEY: ${{ secrets.CALIL_APP_KEY }}
   ```
   apply は `az deployment sub create ...` を同様に。`CALIL_APP_KEY` は GitHub Secret から `env` で渡す。
3. アプリ配信ワークフロー（azure-static-web-apps.yml）とは別ワークフローにし、責務を分離する。
