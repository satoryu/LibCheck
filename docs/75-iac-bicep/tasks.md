# インフラの IaC 化（Bicep） — Tasks

Issue: #75

## Bicep
- [x] `infra/modules/staticWebApp.bicep`（SWA Free + appsettings 子リソース、secure param、settable プロパティ再表明）
- [x] `infra/main.bicep`（**resource group スコープ**、モジュール呼び出し、output hostname）
- [x] `infra/main.bicepparam`（calilAppKey は `readEnvironmentVariable`）
- [x] `az bicep build` 警告なし通過
- [x] `az deployment group what-if` で破壊的変更なしを確認（残差は無害ノイズと特定）

## CI 自動適用（OIDC・最小権限・承認ゲート）
- [x] Azure: App 登録 + SP + フェデレーション資格情報（pull_request / environment:production）
- [x] Azure: ロール割当（Contributor @ rg-libcheck のみ＝最小権限）
- [x] GitHub: Secrets（AZURE_CLIENT_ID / AZURE_TENANT_ID / AZURE_SUBSCRIPTION_ID / CALIL_APP_KEY）
- [x] GitHub: `production` 環境 + required reviewers（承認ゲート）
- [x] `.github/workflows/infra.yml`（PR=what-if / main・dispatch=apply）

## ドキュメント
- [x] `infra/README.md`（手動手順 + CI + OIDC セットアップ + what-if 残差）
- [x] `DEPLOY.md` から `infra/` 参照、`infra/*.json` を gitignore
- [x] `docs/75-iac-bicep/{requirements,design}.md` を最終構成に更新

## 仕上げ
- [ ] PR 更新・セルフレビュー
- [ ] PR 上で what-if ジョブ（OIDC）がグリーンになることを確認
- [ ] マージ後、apply ジョブ（承認 → 適用）で冪等性を確認
