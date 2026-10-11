# 実装タスク: ISBN 検索結果ページを未ログインでも部分表示する（#159）

TDD で進める（失敗するテストを先に書く → 実装 → リファクタ）。

## 1. 認証の復元中フラグ

- [ ] `AuthProvider.test.tsx`: `isRestoring` のテスト → 実装

## 2. 結果ページ

- [ ] `publicPaths`: `/result/:isbn` を公開（テスト → 実装）
- [ ] `BookSearchResultPage.test.tsx`: 未ログインの表示・保護 API を呼ばない・復元中・ログインで切り替え（テスト → 実装。既存の中身は `AuthenticatedResult` へ移す）
- [ ] `PublicResultPreview` の案内（ログイン・地域から探す）

## 3. 配信 HTML の本ごとのメタ

- [ ] `bookMeta.js`（OpenBD 取得・キャッシュ・タイムアウト）のテスト → 実装
- [ ] `routeMeta` / middleware: `/result/:isbn` の書き換え（テスト → 実装）

## 4. 全体確認

- [ ] `npm test` / `npx tsc -b` / `npm run build`
- [ ] `wrangler pages dev` で配信 HTML を `curl`（本ごとの title・og:*、noindex、canonical、不正 ISBN・該当なし）
- [ ] ブラウザ: 未ログインのコールドロード（保護 API を呼ばない）・その場でログイン → 蔵書状況（`VITE_AUTH_MOCK=true`）・ログイン済みのコールドロードで案内が出ない
- [ ] PR 作成・セルフレビュー
- [ ] マージ後: デプロイ監視 → `scripts/smoke.sh` → 本番で配信 HTML と未ログイン表示を確認 → PR / Issue に記録
