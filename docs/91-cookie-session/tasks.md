# #91 HttpOnly Cookie セッション — Tasks

TDD で進める。

- [x] 1. `googleAuth`（session sign/verify・cookie ヘルパ・requireUser cookie 対応）の失敗するテストを書く
- [x] 2. `googleAuth.js` に signSession/verifySession/cookie ヘルパ + requireUser cookie 対応を実装
- [x] 3. `functions/api/session.js`（POST/DELETE）の失敗するテストを書く
- [x] 4. `functions/api/session.js` を実装
- [x] 5. `protectedRequest` / api クライアント / serverRepo を token 任意（Cookie 前提）に変更し、関連テストを更新
- [x] 6. `sessionApiClient.ts`（restore/create/destroy）を実装＋テスト
- [x] 7. `AuthProvider` にマウント復元 + create/destroy を組み込み（注入可）＋テスト更新
- [x] 8. `vite-dev-persistence.ts` に /api/session・/api/me ルートと SESSION_SECRET を追加
- [x] 9. `npx tsc -b` / `npm test` 緑
- [ ] 10. PR 作成 → セルフレビュー → 指摘修正
- [ ] 11. （デプロイ後）本番でログイン→リロード維持、ログアウト→401、SESSION_SECRET 設定を確認
