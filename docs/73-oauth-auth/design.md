# OAuth 認証（#73 / Phase 2） — Design

## Architecture Overview

クライアントは **GIS** で Google の ID トークン(JWT)を取得し、メモリに保持。表示用にトークンをデコード。サーバー検証が必要な API（本 Phase は `/api/me`、後続 #74 の永続化 API）には `Authorization: Bearer` で送り、Pages Function が `jose` で JWKS 検証する。

```mermaid
flowchart TD
  GIS[Google Identity Services] -->|ID token(JWT)| Auth[AuthProvider（メモリ保持・デコード）]
  Auth -->|user 表示| UI[ログインUI / ヘッダ]
  Auth -->|Bearer token| Fn["/api/me (Pages Function)"]
  Fn -->|jose で JWKS 検証 iss/aud/exp| JWKS[(Google JWKS)]
  Fn -->|200 user / 401| Auth
```

## Component Design

### Domain
- `src/domain/models/user.ts`: `interface User { id: string; email?: string; name?: string; picture?: string }`（`id` = Google `sub`）。

### Server（Pages Functions）
- `functions/api/me.js`:
  - `export async function onRequestGet(context)` … `Authorization: Bearer` を取り出し、`verifyGoogleIdToken(token, env.GOOGLE_CLIENT_ID)` で検証 → 200 `{id,email,name,picture}` / 401。
  - `export async function verifyGoogleIdToken(token, clientId)` … `jose` の `createRemoteJWKSet('https://www.googleapis.com/oauth2/v3/certs')` + `jwtVerify` で `issuer ∈ {https://accounts.google.com, accounts.google.com}`・`audience = clientId`・`exp` を検証し、payload から user を組む。**ハンドラと別に export** して Node 単体テスト可能にする。
  - `GOOGLE_CLIENT_ID` は Pages の環境変数（公開値）。

### Client（data / presentation）
- `src/data/datasources/authConfig.ts`: `GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''`。
- 依存追加: `@react-oauth/google`（GIS の React ラッパー：`GoogleOAuthProvider` + `GoogleLogin`）、`jose`（server 検証）。表示用デコードは軽量に payload を `atob` で取り出す小関数（検証はしない＝表示専用）。
- `src/presentation/auth/AuthProvider.tsx` + `useAuth()`:
  - state: `{ user: User | null, idToken: string | null }`。
  - `signIn(credential)`（`GoogleLogin onSuccess` から ID トークンを受け取り、デコードして user セット）、`signOut()`（state クリア + GIS の `disableAutoSelect`）。
  - メモリ保持（リロードで消える→ GIS One Tap/サイレントで復帰可能）。
- UI: `src/presentation/widgets/AuthButton.tsx` … 未ログインは `<GoogleLogin>`、ログイン中は name/avatar + サインアウト。配置は `AppShell`（または図書館管理画面ヘッダ）。
- 認可ヘルパ（#74 で本格使用）: `useAuth().idToken` を取得し、保護 API 呼び出し時に `Authorization: Bearer` を付与する薄い fetch ラッパ。本 Phase は `/api/me` の疎通確認に使用。

### プロバイダツリー / DI
- `App.tsx`: `GoogleOAuthProvider(clientId=GOOGLE_CLIENT_ID)` と `AuthProvider` を、Dependencies/QueryClient の内側・Router の外側に追加。
- `src/test/testUtils.tsx`: テスト用に AuthProvider をスタブ（ログイン済み/未ログインを注入可能に）。`GoogleOAuthProvider` はテストでは未ログイン既定。

## Data Flow
1. `GoogleLogin` 成功 → ID トークン → `AuthProvider` が保持・デコードして user 表示。
2. 保護 API 呼び出しは `Authorization: Bearer <idToken>`。
3. `/api/me` が `jose` で JWKS 検証 → 200 user / 401。

## ローカル認証モック（dev 専用）

Google クライアント ID 無しでローカル起動できるよう、認証をモックに差し替える仕組みを入れる。

- **切替フラグ**: クライアント `VITE_AUTH_MOCK=true`（`.env.local`）／サーバ `AUTH_MOCK=1`（`.dev.vars`）。
- **固定 Dev アイデンティティ**: `MOCK_USER = { id:'mock-user', email:'dev@example.com', name:'Dev User' }`、`MOCK_ID_TOKEN = 'mock.dev.token'`（クライアント/サーバで共有する定数）。
- **クライアント**: `const authMockEnabled = import.meta.env.DEV && import.meta.env.VITE_AUTH_MOCK === 'true'`。
  - 有効時: `AuthProvider.signIn()` は GIS を介さず `MOCK_USER` + `MOCK_ID_TOKEN` をセット。`AuthButton` は「Dev ログイン（モック）」ボタンを表示。
  - `GoogleOAuthProvider` は **モック有効時/クライアント ID 未設定時はマウントしない**（`@react-oauth/google` の clientId 必須要件を回避）。`npm run dev` で ID 無しでも動く。
- **サーバ（`/api/me`）**: `env.AUTH_MOCK === '1'` のとき、Bearer が `MOCK_ID_TOKEN` なら JWKS 検証をスキップして `MOCK_USER` を返す。それ以外は通常検証。
- **安全策**: クライアントのモック経路は `import.meta.env.DEV`（本番ビルドで `false`）でガードし**ビルドから除去**。サーバは**本番 Pages env に `AUTH_MOCK` を設定しない**ことで無効（デフォルト無効・明示時のみ有効）。`AUTH_MOCK` は `.dev.vars`（gitignore 済）にのみ置く。
- **使い方**: `.env.local` に `VITE_AUTH_MOCK=true`、`.dev.vars` に `AUTH_MOCK=1` を入れて `npm run dev` / `npm run pages:dev`。`.env.local.example` / `.dev.vars.example` に注記を追加。

## セキュリティ
- 署名(JWKS)・`iss`・`aud`(=clientId)・`exp` を server で必須検証。クライアント側デコードは表示専用で信頼しない。
- クライアント ID は公開値（`VITE_GOOGLE_CLIENT_ID` / Pages env `GOOGLE_CLIENT_ID`）。シークレット無し（GIS）。
- 認証モックは dev 専用（上記ガード）。本番では存在しない/無効。

## テスト
- `verifyGoogleIdToken`: `jose` でテスト用鍵を生成し自己署名トークンを作成 → 有効/`aud`不一致/期限切れ/署名不正/欠如 を検証（JWKS はテストで差し替え可能にするか、関数に `jwksResolver` を注入できる形にする）。
- `AuthProvider`/`useAuth`: signIn で user セット、signOut でクリア。
- `AuthButton`: 未ログイン=ログインボタン、ログイン中=名前表示。
- 既存フロー非破壊（未ログインで検索→登録が従来どおり）。

## 検証（実機）
- `VITE_GOOGLE_CLIENT_ID` と Pages env `GOOGLE_CLIENT_ID` を設定し、`libcheck.pages.dev`（または `npm run dev`）で Google ログイン→ name 表示→`/api/me` 200 を確認。クライアント ID 発行はユーザー手元（Google Cloud Console）。

## 影響/非対象
- localStorage→D1 のデータ永続化・移行は #74。本 Phase はログインと識別・検証エンドポイントまで。
