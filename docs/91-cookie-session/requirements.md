# #91 HttpOnly Cookie セッション — Requirements

## Problem Statement

ID トークンをメモリ（React state）のみで保持しているため、ブラウザをリロードするとログイン状態が失われ、毎回 Google 再認証を求められる。サーバ発行の HttpOnly Cookie セッションで「リロードしても維持」を実現する。HttpOnly によりトークンは JS から読めず（XSS 窃取不可）、SameSite=Strict で CSRF を防ぐ。

## Requirements

### Functional

- FR-1: `POST /api/session` は GIS の ID トークンを検証（jose）し、署名済みセッション JWT を HttpOnly/Secure/SameSite=Strict Cookie で発行する。
- FR-2: `DELETE /api/session` はセッション Cookie を削除する（ログアウト）。
- FR-3: `requireUser` はセッション Cookie を受理する（後方互換のため既存 Bearer も受理）。
- FR-4: `GET /api/me` は Cookie からユーザーを返す。
- FR-5: クライアントはマウント時に `GET /api/me` でセッションを復元し、有効なら再認証なしでログイン状態にする。
- FR-6: 保護 API / Calil 呼び出しは、リロード後（メモリにトークン無し）でも同一オリジン Cookie で認証される。
- FR-7: ログイン時にセッション Cookie が作成され、ログアウトで削除される。

### Non-Functional

- NFR-1: 既存サーバテスト（Bearer モック）を壊さない（requireUser は Cookie と Bearer の両対応）。
- NFR-2: ローカル dev でも同じフロー（`/api/session`・`/api/me`）が動くよう dev プラグインで実行する。
- NFR-3: `SESSION_SECRET` はサーバ専用シークレット（クライアントに出ない）。

## Constraints

- セッション Cookie は HttpOnly・Secure・SameSite=Strict・Path=/。
- 同一オリジン fetch（既定 credentials=same-origin）で Cookie が自動送信されることに依拠。
- セッション有効期限はサーバ側で管理（既定 7 日）。失効後は再ログイン。

## Acceptance Criteria

- AC-1: ログイン後にリロードしても再認証なしでログイン状態が維持される。
- AC-2: Cookie 無し/無効で保護 API は 401。
- AC-3: ログアウトで Cookie が消え、保護 API が 401 になる。
- AC-4: 既存テスト + 新規テスト緑、`npx tsc -b` 緑。

## User Stories

- 利用者として、一度ログインしたらリロードしても入り直さずに使い続けたい。

## Out of Scope（将来）
- リフレッシュトークン/スライディング有効期限、サーバ側セッション失効リスト、複数デバイスのセッション管理。
