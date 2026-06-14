# インフラの IaC 化（Bicep） — Tasks

Issue: #75

- [x] `infra/modules/staticWebApp.bicep` を作成（SWA Free + appsettings 子リソース、secure param）
- [x] `infra/main.bicep` を作成（subscription scope：RG + モジュール呼び出し、output hostname）
- [x] `infra/main.bicepparam` を作成（calilAppKey は `readEnvironmentVariable`）
- [x] `az bicep build` でビルド/リント通過を確認（警告なし）
- [x] `az deployment sub what-if` で既存リソースへの破壊的変更が無いことを確認（残差は無害なノイズと特定）
- [ ] （任意・要承認）`az deployment sub create` で実適用し冪等性を確認 ← 本番 SWA への適用のため、ユーザー判断を仰ぐ
- [x] `infra/README.md` に手動デプロイ手順 + CI 自動適用の今後方針 + what-if 残差の説明を記載
- [x] `DEPLOY.md` から `infra/` を参照（リソースはコード管理に移行した旨）
- [ ] PR 作成・セルフレビュー
