# #87 セキュリティ強化（M-2 / L-1）— Tasks

TDD で進める。

- [x] 1. `validation` の失敗するテストを書く（サイズ超過 413・配列長超過 413・必須欠落 400・正常 ok）
- [x] 2. `functions/_shared/validation.js` を実装しテストを緑にする
- [x] 3. `registered-libraries.js` PUT に検証を組み込む（text→size→parse→validate）
- [x] 4. `search-history.js` PUT に検証を組み込む
- [x] 5. `persistence.test.ts` を拡張（413・不正要素 400・既存正常系維持）
- [x] 6. `public/_headers` を追加（CSP ほかセキュリティヘッダ）
- [x] 7. `_headers` の主要ディレクティブを検証するテストを追加（regression ガード）
- [x] 8. `npx tsc -b` / `npm test` 緑
- [ ] 9. PR 作成 → セルフレビュー → 指摘修正
- [ ] 10. （ブラウザ）本番相当で Google ログイン・カメラ・書影が CSP 下で動作し CSP 違反が出ないこと
