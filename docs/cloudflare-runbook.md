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

## D1 のバックアップと復旧（Time Travel）

D1 には **Time Travel**（ポイントインタイムリカバリ）が標準で備わる。追加設定・追加コストなし。

- 保持期間: **無料プランは 7 日 / Workers Paid は 30 日**。それより古い時点には戻せない。
- 復旧は**破壊的（データベースをその場で上書き）**。実行前に必ず「現在のブックマーク」を控え、undo できるようにする。

### 事故時の復旧手順
```bash
# 0) 前提: wrangler v3.4.0+、CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID を環境に設定
#    （ローカルに wrangler が入らない場合は npx wrangler@latest でも可）

# 1) まず「現在」のブックマークを控える（undo 用。必ずやる）
npx wrangler d1 time-travel info libcheck

# 2) 戻りたい時点のブックマークを確認
npx wrangler d1 time-travel info libcheck --timestamp="2026-07-04T00:00:00+09:00"

# 3) 復旧（上書き。実行中のクエリは中断される）
npx wrangler d1 time-travel restore libcheck --timestamp=UNIX_TIMESTAMP
#   または --bookmark=BOOKMARK_ID

# 4) 検証: 本番アプリで登録図書館・履歴が想定どおりか確認。
#    誤って戻しすぎた場合は 1) で控えたブックマークに restore し直す（undo）
```

> スキーマは `infra/d1/migrations/` が正本なので、DB を作り直す事態でも
> `d1 migrations apply --remote` で再構築できる（データは Time Travel の範囲のみ）。

## ユーザーデータの削除依頼への対応（プライバシーポリシー第6条）

D1 は **email を保存していない**（`user_id` = Google の `sub` のみ。データ最小化）。
そのため削除依頼は以下の順で対応する。

1. **本人がログインできる場合（原則こちらに誘導）**: アプリ内で完結する。
   - 検索履歴: 履歴画面の全削除
   - 登録図書館: 図書館画面ですべて登録解除
   - これでサーバ上の本人データは空になる（セッション Cookie はログアウトで削除）
2. **ログインできない場合**: 本人確認のうえ `user_id`（Google アカウントの `sub`）を特定し、
   以下の SQL を実行する。
   ```bash
   npx wrangler d1 execute libcheck --remote \
     --command "DELETE FROM registered_libraries WHERE user_id='<sub>'; DELETE FROM search_history WHERE user_id='<sub>';"
   ```
   （wrangler が使えない環境では Cloudflare ダッシュボードの D1 コンソール、
   または D1 REST API `/accounts/{account_id}/d1/database/{db_id}/query` でも可）
3. 対応後、依頼者に完了を連絡する。削除されるのは登録図書館・検索履歴のすべて
   （アカウント自体は Google 管理であり本アプリには存在しない）。
