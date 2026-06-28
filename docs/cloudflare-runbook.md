# Cloudflare 構成 runbook（軽量 IaC）

LibCheck の本番は **Cloudflare Pages + Pages Functions + D1** で構成する（移設の経緯は #78、Cosense「LibCheck 2026/6/17」）。本書はその構成・設定値・再作成手順をまとめた軽量 IaC（正本は `wrangler.toml` と本 runbook、設定はダッシュボード/API/CI）。

## リソース一覧

| 種別 | 名前 / 値 | 管理場所 |
| --- | --- | --- |
| Pages プロジェクト | `libcheck`（正規 `https://libcheck.app`、Pages 既定 `libcheck.pages.dev`） | Cloudflare（`wrangler.toml` の `name`） |
| 静的出力 | `dist`（Vite ビルド） | `wrangler.toml` `pages_build_output_dir` |
| SPA フォールバック | `public/_redirects` | リポジトリ |
| Pages Functions | `functions/**`（calil プロキシ / 認証 / セッション / 永続化 API） | リポジトリ（デプロイ時に自動バンドル） |
| D1 データベース | バインド `DB` / 名前 `libcheck` / id `ba647dce-2a7a-4e0e-88f9-349dce14ce51` | `wrangler.toml` `[[d1_databases]]` |
| D1 スキーマ | `infra/d1/migrations/`（連番マイグレーション） | リポジトリ（適用は CI） |

## シークレット / 変数

### Pages プロジェクトのシークレット（すべて `secret_text`）
`wrangler pages deploy` をまたいで保持させるため **必ず `secret_text`**（plain だと消える。#83 のコメント参照）。

| 名前 | 用途 |
| --- | --- |
| `CALIL_APP_KEY` | カーリル API キー（サーバ注入・クライアント非公開） |
| `GOOGLE_CLIENT_ID` | Google ID トークン検証の `aud`（公開値だが保持目的で secret_text） |
| `SESSION_SECRET` | セッション JWT(HS256) の署名鍵（#91） |

設定例（Cloudflare API・トークンは一時ファイル経由で値は出さない）:
```bash
CF_TOKEN=$(cat /tmp/cf_token); CF_ACCT=$(cat /tmp/cf_acct)
curl -sS -X PATCH -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCT/pages/projects/libcheck" \
  --data '{"deployment_configs":{"production":{"env_vars":{"<NAME>":{"type":"secret_text","value":"<VALUE>"}}}}}'
```
> 注意: env 変更は**新しいデプロイで反映**される（設定後に再デプロイが必要）。

### GitHub Actions シークレット（CI デプロイ用）
| 名前 | 用途 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | `wrangler` のデプロイ / D1 マイグレーション適用 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID |

### GitHub Actions 変数（公開値・ビルド時注入）
| 名前 | 値 |
| --- | --- |
| `AMAZON_ASSOCIATE_TAG` | `libcheck-22`（アフィリエイトタグ） |
| `GOOGLE_CLIENT_ID` | GIS クライアント ID（フロントに埋め込む公開値） |

## CI / デプロイ経路

| ワークフロー | トリガ | 役割 |
| --- | --- | --- |
| `.github/workflows/ci.yml` | PR / push main | 型チェック + テスト |
| `.github/workflows/d1-migrate.yml` | PR（migrations 変更） | `d1 migrations apply --local`（SQL 検証） |
| `.github/workflows/cloudflare-pages.yml` | push main / 手動 | `d1 migrations apply --remote`（デプロイ前）→ `pages deploy` |

## ゼロから再作成する手順（概略）
1. Cloudflare で Pages プロジェクト `libcheck` を作成（Direct Upload / wrangler）。
2. D1 を作成し `wrangler.toml` の `database_id` を更新。`d1 migrations apply --remote` でスキーマ適用。
3. Pages プロジェクトに `CALIL_APP_KEY` / `GOOGLE_CLIENT_ID` / `SESSION_SECRET` を `secret_text` で設定。
4. GitHub に `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`（secrets）、`AMAZON_ASSOCIATE_TAG` / `GOOGLE_CLIENT_ID`（variables）を設定。
5. main へ push → `cloudflare-pages.yml` がマイグレーション適用 + デプロイ。

## カスタムドメイン（#71）
- ドメイン `libcheck.app`（Cloudflare Registrar で取得）。**apex を正規**とする。
- Cloudflare Pages のカスタムドメインに **`libcheck.app`（apex）** と **`www.libcheck.app`** を追加（DNS・証明書は自動）。`www` は apex へリダイレクト（Rules → Redirect Rules）。
- **Google OAuth**: クライアントの「承認済み JavaScript 生成元」に `https://libcheck.app`（および使うなら `https://www.libcheck.app`）を追加。同意画面の「アプリのプライバシーポリシー URL / 利用規約 URL」を `https://libcheck.app/privacy-policy` / `https://libcheck.app/terms` に更新。
- 法務ページ（privacy/terms）とアプリ内リンクは相対パスのためドメイン非依存（変更不要）。
