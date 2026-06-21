# 登録図書館・検索履歴のサーバー永続化（#74 / Phase 3） — Tasks

TDD（失敗するテスト→実装→リファクタ）。

## 認証ゲート / セッション
- [ ] `authTokenStore.ts`（get/set）
- [ ] `AuthProvider`：idToken を AuthTokenStore に同期、signOut で queryClient.clear()
- [ ] `AuthGate.tsx`（未ログイン→ログイン画面） + テスト
- [ ] `LoginPage.tsx`（説明 + GoogleLogin useOneTap auto_select）
- [ ] `App.tsx`：ルーターを AuthGate で包む

## サーバー（Pages Functions）
- [ ] `functions/_shared/googleAuth.js`（verifyGoogleIdToken を me.js から移設、me.js も import）
- [ ] `functions/_shared/requireUser.js`（Bearer→検証→user/401） + テスト
- [ ] `functions/api/registered-libraries.js`（GET/PUT・D1） 
- [ ] `functions/api/search-history.js`（GET/PUT・D1）
- [ ] D1 スキーマ `infra/d1/schema.sql`

## クライアント data 層
- [ ] `registeredLibraryApiClient.ts` / `searchHistoryApiClient.ts`（GET/PUT・Bearer・timeout）
- [ ] `ServerRegisteredLibraryRepository`（既存IF・GET→変更→PUT・tokenProvider） + テスト
- [ ] `ServerSearchHistoryRepository`（既存IF） + テスト
- [ ] `dependencies.tsx` を本番サーバー版に配線（makeFakeDeps は Fake 既定のまま）

## 検証
- [ ] `npx tsc -b` / `npm test` グリーン（既存フロー無改変で緑・新規テスト含む）
- [ ] 外部セットアップ（ユーザートークンで代行）: D1 作成・バインド・スキーマ適用・Pages env `GOOGLE_CLIENT_ID`
- [ ] `libcheck.pages.dev` で実機: ログイン→図書館登録/検索→別セッション（シークレットウィンドウ）で同データ確認
- [ ] PR 作成・セルフレビュー

## 後続（#78）
- #71 ドメイン / Cloudflare IaC / Azure デコミッション
