# #83 D1 スキーマのマイグレーション運用化 — Tasks

TDD（失敗するテスト→実装→リファクタ）で進める。

- [x] 1. `orderedMigrationStatements()` の失敗するテストを書く（連番順・`.sql`のみ・コメント除去・文分割）
- [x] 2. `orderedMigrationStatements()` を実装し、テストを緑にする
- [x] 3. `infra/d1/migrations/0001_init.sql` を作成（現行 schema.sql 等価・`IF NOT EXISTS` 維持）
- [x] 4. `infra/d1/schema.sql` を廃止（migrations へ集約）
- [x] 5. `vite-dev-persistence.ts` を `orderedMigrationStatements()` 利用＋migrations ディレクトリ読込に変更
- [x] 6. `wrangler.toml` の `[[d1_databases]]` に `migrations_dir` を追加
- [x] 7. `cloudflare-pages.yml` に「Apply D1 migrations (remote)」ステップを deploy 前に追加
- [x] 8. `d1-migrate.yml`（PR の `--local` 検証）を新規作成
- [x] 9. `infra/d1/README.md`（マイグレーション追加手順）を作成
- [x] 10. `npx tsc -b` と `npm test` が緑であることを確認
- [ ] 11. PR 作成 → セルフレビュー（正確性・可読性・性能・セキュリティ・保守性）→ 指摘修正
- [ ] 12. （マージ後）本番で migrations 自動適用とアプリ動作を確認
