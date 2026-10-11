# 実装タスク: ISBN 検索結果ページを未ログインでも部分表示する（#159）

TDD で進める（失敗するテストを先に書く → 実装 → リファクタ）。

## 0. 決定事項（2026-10-11）

- [x] 共有ボタンは範囲外とし #191 に起票
- [x] 未ログインの表示は別イベント `book_preview_view` で計測
- [x] OGP タイトルは「『{書名}』が図書館で借りられるか、LibCheckで確認」

## 1. 認証の復元中フラグ

- [x] `AuthProvider.test.tsx`: `isRestoring` のテスト → 実装

## 2. 結果ページ

- [x] `publicPaths`: `/result/:isbn` を公開（テスト → 実装）
- [x] `BookSearchResultPage.test.tsx`: 未ログインの表示・保護 API を呼ばない・復元中・ログインで切り替え（テスト → 実装。既存の中身は `AuthenticatedResult` へ移す）
- [x] `PublicResultPreview` の案内（ログイン・地域から探す）
- [x] GA4 イベント `book_preview_view`（テスト → 実装）とプライバシーポリシーの追記

## 3. 配信 HTML の本ごとのメタ

- [x] `bookMeta.js`（OpenBD 取得・キャッシュ・タイムアウト）のテスト → 実装
- [x] `routeMeta` / middleware: `/result/:isbn` の書き換え（テスト → 実装）
- [x] 書影に差し替えるときは既定画像のサイズ指定（og:image:width / height）を外す

## 4. 全体確認

- [x] `npm test` / `npx tsc -b` / `npm run build`
- [x] `wrangler pages dev` で配信 HTML を `curl`（本ごとの title・og:*、noindex、canonical、不正 ISBN・該当なし）
- [x] ブラウザ: 未ログインのコールドロード（保護 API を呼ばない）・その場でログイン → 蔵書状況（`VITE_AUTH_MOCK=true`）・ログイン済みのコールドロードで案内が出ない
- [ ] PR 作成・セルフレビュー
- [ ] マージ後: デプロイ監視 → `scripts/smoke.sh` → 本番で配信 HTML と未ログイン表示を確認 → PR / Issue に記録
