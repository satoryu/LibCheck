# OAuth 認証（#73 / Phase 2） — Tasks

TDD（失敗するテスト→実装→リファクタ）。

## Domain
- [ ] `src/domain/models/user.ts`（User: id/email/name/picture）

## Server（Pages Functions）
- [ ] `functions/api/me.js`: `verifyGoogleIdToken(token, clientId, opts?)`（jose・JWKS・iss/aud/exp）を export、`onRequestGet` で 200/401
- [ ] `verifyGoogleIdToken` の単体テスト（有効/aud不一致/期限切れ/署名不正/無トークン。JWKS リゾルバ注入で自己署名鍵を使用）

## Client
- [ ] 依存追加: `@react-oauth/google`, `jose`
- [ ] `src/data/datasources/authConfig.ts`（`VITE_GOOGLE_CLIENT_ID`）、`vite-env.d.ts` 追記
- [ ] `src/presentation/auth/AuthProvider.tsx` + `useAuth`（signIn/signOut・メモリ保持・表示用デコード）+ テスト
- [ ] `src/presentation/widgets/AuthButton.tsx`（未ログイン=GoogleLogin / ログイン中=name+サインアウト）+ テスト
- [ ] `App.tsx` に `GoogleOAuthProvider` + `AuthProvider` を追加、`AppShell` に AuthButton 配置
- [ ] `src/test/testUtils.tsx` に AuthProvider スタブ（ログイン済/未ログイン注入）

## ローカル認証モック（dev 専用）
- [ ] 共有定数 `MOCK_USER` / `MOCK_ID_TOKEN`（クライアント/サーバ）
- [ ] クライアント: `authMockEnabled = import.meta.env.DEV && VITE_AUTH_MOCK==='true'`、`AuthProvider`/`AuthButton` のモック分岐、`GoogleOAuthProvider` をモック時/ID未設定時に非マウント
- [ ] サーバ: `/api/me` の `AUTH_MOCK==='1'` 分岐（MOCK_ID_TOKEN→MOCK_USER、それ以外は通常検証）+ テスト
- [ ] `.env.local.example`（`VITE_AUTH_MOCK`）/ `.dev.vars.example`（`AUTH_MOCK`）に注記
- [ ] 本番ビルドにモック経路が含まれない（DEV ガード）ことを確認

## 検証
- [ ] `npx tsc -b` / `npm test` グリーン（既存フロー非破壊を含む）
- [ ] モックで `npm run dev` 起動 → Google ID 無しで Dev ログイン/サインアウトできる
- [ ] Pages env `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` 設定（ユーザー: Google クライアント ID 発行）
- [ ] 実機: Google ログイン→name 表示→`/api/me` 200（`libcheck.pages.dev` or ローカル）
- [ ] PR 作成・セルフレビュー

## 後続（#74 / Phase 3）
- 保護 API（D1）に `Authorization: Bearer` を要求、`verifyGoogleIdToken` を共有/ミドルウェア化、localStorage→D1 移行
