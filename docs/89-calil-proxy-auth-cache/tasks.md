# #89 Calil プロキシ 認証必須化 + library キャッシュ — Tasks

TDD で進める。

- [x] 1. プロキシ Function の失敗するテストを書く（401 / 404 / library=public / check=no-store / appkey 注入）
- [x] 2. `functions/api/calil/[action].js` に requireUser + キャッシュ + ヘッダを実装しテストを緑にする
- [x] 3. `CalilApiClient` の失敗するテストを書く（tokenProvider あり → Bearer 送出 / なし → 無ヘッダ）
- [x] 4. `CalilApiClient` に tokenProvider + authHeaders を実装
- [x] 5. `calilApiConfig.ts` のコメントを Cloudflare/認証前提に更新
- [x] 6. `npx tsc -b` / `npm test` 緑
- [ ] 7. PR 作成 → セルフレビュー → 指摘修正
- [ ] 8. （デプロイ後）本番で 401（無トークン）・ログイン後の検索・library の Cache-Control を確認
