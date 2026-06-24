# D1 スキーマ運用（マイグレーション）

LibCheck の Cloudflare D1（`registered_libraries` / `search_history`、#74）のスキーマは
`infra/d1/migrations/` 配下の**連番マイグレーション**で管理する（#83）。

## 仕組み

- マイグレーションファイル: `infra/d1/migrations/NNNN_説明.sql`（例: `0001_init.sql`）
- 正本は `wrangler d1 migrations`。適用済みは D1 内の `d1_migrations` 表で追跡される。
- `wrangler.toml` の `[[d1_databases]]` に `migrations_dir = "infra/d1/migrations"` を設定済み。

### 適用の経路

| タイミング | 何が起きるか | どこ |
| --- | --- | --- |
| PR（`infra/d1/migrations/**` 変更） | `d1 migrations apply libcheck --local`（一時 SQLite に適用＝SQL 検証。本番に触れない） | `.github/workflows/d1-migrate.yml` |
| main マージ / 手動 | `d1 migrations apply libcheck --remote` を**デプロイ前**に実行（未適用のみ・冪等） | `.github/workflows/cloudflare-pages.yml` |
| ローカル `npm run dev` | `infra/d1/migrations/` を連番順に `.dev.d1.sqlite` へ適用 | `vite-dev-persistence.ts` → `vite-dev-migrations.ts` |

本番適用はデプロイと同一ジョブの前段ステップに置き、「スキーマ→コード」の順序を保証する。

## 新しいマイグレーションの追加手順

1. 直前の番号 + 1 でファイルを作る: `infra/d1/migrations/0002_説明.sql`
2. SQL を書く。可能なら冪等（`IF NOT EXISTS` / `ADD COLUMN` 等）にする。
   - ⚠️ D1(SQLite) の `ALTER TABLE` は機能が限られる（列の削除・型変更は不可）。
     非互換変更は「新テーブル作成 → データ移送 → 旧テーブル削除」の手順を分割して書く。
3. ローカル確認: `npm run dev` を起動し、対象機能（登録図書館・検索履歴）が動くこと。
4. PR を出すと CI（`d1-migrate.yml`）が `--local` 適用で SQL を検証する。
5. main にマージすると本番 D1 へ自動適用され、続けてアプリがデプロイされる。

## ベースライン（0001）の注意

`0001_init.sql` は #74 で手動適用済みの本番 D1 に対する**ベースライン**。本番には
`d1_migrations` 表が無い状態で初回 `--remote` 適用が走るため `0001` が実行されるが、
`CREATE TABLE IF NOT EXISTS` により実テーブルは no-op で、wrangler が `0001` を
適用済みとして記録する。以降は通常どおり差分（`0002` 以降）だけが適用される。
