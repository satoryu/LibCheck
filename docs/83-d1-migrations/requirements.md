# #83 D1 スキーマのマイグレーション運用化 — Requirements

## Problem Statement

#74 で登録図書館・検索履歴を Cloudflare D1 に永続化した。スキーマは `infra/d1/schema.sql` を手動で `wrangler d1 execute --remote --file` 適用する運用になっている。これには次の課題がある。

- **追跡性の欠如**: スキーマ変更の履歴と「どこまで適用済みか」が記録されない。
- **再現性・安全性の低さ**: 本番適用が手動で、人為ミス・適用漏れ・二重適用のリスクがある。
- **経路の分散**: ローカル（`vite-dev-persistence.ts` が `schema.sql` を読む）と本番で、スキーマの管理経路が別々。

## Requirements

### Functional

- FR-1: スキーマ変更を連番マイグレーションファイル（`NNNN_*.sql`）として管理する。
- FR-2: main へのマージで、本番 D1 に未適用のマイグレーションが自動適用される。
- FR-3: 適用済みマイグレーションは冪等にスキップされる（再実行で副作用がない）。
- FR-4: PR 時に、マイグレーションが正しい SQL として適用できることを本番に触れずに検証する。
- FR-5: ローカル開発（`npm run dev`）が、同じマイグレーション群から同一スキーマを構築する。
- FR-6: 新しいマイグレーションの追加手順がドキュメント化されている。

### Non-Functional

- NFR-1: 本番への適用は**コードのデプロイより前**に完了し、スキーマ→コードの順序を保証する。
- NFR-2: マイグレーション適用に失敗した場合、デプロイは進まない（失敗が握りつぶされない）。
- NFR-3: CI はローカルへの `wrangler` グローバルインストール（過去に sharp のネイティブビルドで失敗）に依存しない。

## Constraints

- 既存の本番 D1（`database_id = ba647dce-...`）には既に `registered_libraries` / `search_history` が存在する。最初のマイグレーション（ベースライン）はこの既存 DB に**冪等適用**できる必要がある（`CREATE TABLE IF NOT EXISTS` を維持）。
- CI からの本番適用は既存の `secrets.CLOUDFLARE_API_TOKEN` / `secrets.CLOUDFLARE_ACCOUNT_ID` を用いる（新規シークレットを増やさない）。
- 既存の `cloudflare-pages.yml`（デプロイ）/ `ci.yml`（型・テスト）の責務を壊さない。
- ローカルの永続化テスト（vitest）は `--experimental-sqlite` 無しでも壊れない（現状の no-op ガードを維持）。

## Acceptance Criteria

- AC-1: `infra/d1/migrations/0001_init.sql` が存在し、現行スキーマと等価。`schema.sql` は廃止または移行される。
- AC-2: `wrangler.toml` の `[[d1_databases]]` に `migrations_dir` が設定されている。
- AC-3: main マージで本番 D1 にマイグレーションが自動適用される（既存テーブルに対しては冪等で no-op）。
- AC-4: PR で、わざと壊した SQL を含めると CI が失敗する（正しい SQL では成功する）。
- AC-5: `npm run dev` がマイグレーション経由で `registered_libraries` / `search_history` を構築し、#74 の永続化が従来どおり動く。
- AC-6: マイグレーション追加手順のドキュメントがある。
- AC-7: `npx tsc -b` と `npm test` が緑。

## User Stories

- 開発者として、スキーマ変更を連番ファイルとして PR に含めたい。レビューで差分が見え、マージで自動適用されるため。
- 開発者として、PR の段階で SQL の誤りに気づきたい。本番に壊れた変更を持ち込まないため。
- 運用者として、本番 D1 のスキーマが「どのマイグレーションまで適用済みか」を把握したい。手作業の適用漏れをなくすため。
