# #91 HttpOnly Cookie セッション — Design

## Architecture Overview

```mermaid
sequenceDiagram
  participant B as ブラウザ(SPA)
  participant S as /api/session
  participant M as /api/me
  participant G as Google JWKS

  Note over B: ログイン
  B->>S: POST {idToken}
  S->>G: jwtVerify(idToken, aud=GOOGLE_CLIENT_ID)
  S-->>B: 200 user + Set-Cookie: session=<署名JWT> (HttpOnly/Secure/SameSite=Strict)

  Note over B: リロード
  B->>M: GET /api/me (Cookie 自動送信)
  M-->>B: 200 user  (Cookie からセッション復元)

  Note over B: ログアウト
  B->>S: DELETE /api/session
  S-->>B: 200 + Set-Cookie: session=; Max-Age=0
```

## Component Design

### サーバ `functions/_shared/googleAuth.js`（拡張）

- `signSession(user, secret, maxAgeSec)`: HMAC(HS256) で `{sub,email,name,picture}` を署名（jose `SignJWT`、exp 付き）。
- `verifySession(token, secret)`: 検証して user を返す（失敗で throw）。
- Cookie ヘルパ: `sessionSetCookie(value, maxAgeSec)` → `session=...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=...`、`sessionClearCookie()` → `Max-Age=0`、`readCookie(request, name)`。
- `requireUser` を「**Cookie 優先**、無ければ既存 Bearer（モック/Google）」に拡張:
  1. `session` Cookie があり `SESSION_SECRET` で検証できれば user。
  2. dev モック: `AUTH_MOCK==='1'` かつ Cookie が `MOCK_SESSION` なら MOCK_USER。
  3. 既存 Bearer 経路（後方互換・既存テスト維持）。
  4. いずれも無ければ 401。`SESSION_SECRET` 未設定かつ Cookie 経路必要時は 500。

> Bearer 経路を残すことで、persistence/me/calil の既存サーバテスト（Bearer モック）は無改変で緑のまま。Cookie は「リロードでも送られる durable な資格情報」として一級で受理する。

### 新規 `functions/api/session.js`

- `onRequestPost`: body `{ idToken }`（モック時は `MOCK_ID_TOKEN`）。
  - モック: `AUTH_MOCK==='1'` && `idToken===MOCK_ID_TOKEN` → user=MOCK_USER・Cookie 値=MOCK_SESSION。
  - 本番: `verifyGoogleIdToken(idToken, env.GOOGLE_CLIENT_ID)` → user・`signSession(user, env.SESSION_SECRET)`。
  - `Set-Cookie` を付けて user を 200 で返す。検証失敗 401、設定不足 500。
- `onRequestDelete`: `sessionClearCookie()` を付けて 200。

### クライアント

- 新規 `src/data/datasources/sessionApiClient.ts`:
  - `restore()`: `GET /api/me`（same-origin・Cookie 自動）→ `User | null`（401/失敗は null）。
  - `create(idToken)`: `POST /api/session {idToken}`。
  - `destroy()`: `DELETE /api/session`。
- `AuthProvider`（拡張・後方互換）:
  - 新 prop `sessionApi`（既定: 実 HTTP 実装）。
  - マウント時、`initialUser` が無ければ `sessionApi.restore()` で復元（成功で setUser）。
  - `signIn(user, idToken)`: 状態を同期更新（従来どおり）＋ `sessionApi.create(idToken).catch(()=>{})`。
  - `signOut()`: 状態クリア＋ `sessionApi.destroy().catch(()=>{})`。
  - 失敗は握りつぶす（テスト/オフラインでも UI を壊さない）。
- 保護クライアント/リポジトリを **Cookie 前提**に:
  - `protectedRequest(fetchFn, url, method, token, body?, timeout)` の `token` を `string | null` に。`token` があるときのみ `Authorization: Bearer` を付け、常に same-origin（Cookie 同送）。
  - `ServerRegisteredLibraryRepositoryImpl` / `ServerSearchHistoryRepositoryImpl`: 「トークン無し→例外」を撤廃し、`tokenProvider()`（null 可）を素通し。認証失敗は API の 401 として表面化。
  - Calil クライアント（#89）は token が null のとき Bearer を付けないので Cookie で通る（変更不要）。

### dev プラグイン `vite-dev-persistence.ts`

- ルートに `/api/session`・`/api/me` を追加（registered-libraries / search-history と同様に function を実行）。
- dev env に `SESSION_SECRET: 'dev-secret'` を追加（既存 `AUTH_MOCK:'1'`, `GOOGLE_CLIENT_ID:'dev'` と併せて）。
- これによりローカルでも「mock ログイン → Cookie 発行 → リロードで /api/me 復元」が本番同等に動く。

## Data Flow

1. ログイン: GIS トークン → `POST /api/session` → Set-Cookie。`signIn` が状態も即更新。
2. リロード: `AuthProvider` が `GET /api/me`（Cookie）→ user 復元。保護/Calil は Cookie で認証。
3. ログアウト: `DELETE /api/session` → Cookie 削除 → 状態クリア。

## セキュリティ

- HttpOnly: JS から読めず XSS 窃取不可。Secure: HTTPS 限定。SameSite=Strict: クロスサイト送信なし＝CSRF 遮断（GIS は JS ログインでリダイレクト不要のため Strict で問題なし）。
- セッション JWT は `SESSION_SECRET`（HS256）で署名。クライアントには出ない。

## Domain Models

`User` 等は不変。本 issue は認証の保持方式（Cookie セッション）の追加であり、ドメインに変更なし。
