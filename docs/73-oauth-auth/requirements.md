# OAuth 認証・認可の導入（#73 / Cloudflare Phase 2） — Requirements

関連: 移設 #78 の Phase 2。前段 = Phase 1（#79・機能パリティ移設済み）。後続 = #74 永続化（D1）。

## Problem Statement

登録図書館情報をユーザーに紐づけてサーバー永続化（#74）する前提として、**ユーザーを識別する認証**を導入する。認証は OAuth（Google）を用いる。Cloudflare へ移設済みのため、`Authorization` ヘッダ横取り問題は無く、標準的なトークン方式で実装できる。

## 採用方針（意思決定済み・推奨セット）
1. **Google ログイン = GIS（Sign in with Google）→ ID トークン（JWT）**。クライアントシークレット不要・リダイレクト不要。
2. **API 連携 = `Authorization: Bearer <ID token>`** を Pages Function が `jose` で **JWKS 検証**（`iss`/`aud`/`exp`）。
3. **ステートレス**（毎リクエスト検証、セッションストア無し）。
4. **Phase 2 スコープ = ログインは任意・追加機能**（ゲスト利用は維持）。本 Phase は「ログイン + ユーザー識別 + 検証エンドポイント `/api/me`」まで。localStorage→D1 のデータ移行は #74。
5. **トークン保持 = メモリ + GIS で再取得**（リロード時はサイレント/One Tap で復帰）。

## Requirements

### Functional
- FR-1: 利用者が Google でサインイン/サインアウトできる。
- FR-2: サインイン後、アプリがユーザー識別子（`sub`）と表示用情報（name/email/picture）を保持・表示する。
- FR-3: Pages Function `/api/me` が `Authorization: Bearer` の ID トークンを検証し、有効なら user 情報を返す（無効/欠如は 401）。
- FR-4: 未ログインでも従来機能（図書館検索・蔵書照会・登録）は利用できる（ログインは任意）。
- FR-5: ローカル開発時、Google クライアント ID 無しでも**認証をモックに差し替えて起動**できる（環境フラグで切替。クライアント/サーバ両側）。

### Non-Functional
- NFR-1: トークン検証は署名（Google JWKS）・`iss`・`aud`(=クライアントID)・`exp` を必ず検証する。検証前のクレームを信頼しない。
- NFR-2: クライアントシークレットは不要（GIS）。Google クライアント ID は公開値（`VITE_` 可）。秘密情報をリポジトリに置かない。
- NFR-3: Clean Architecture の層分離（domain に User、検証ロジックは server 側 Function、UI 状態は presentation の AuthProvider）。
- NFR-4: Vitest / 型チェックを維持・グリーン。検証ロジックは単体テスト可能にする。
- NFR-5: 認証モックは**開発専用**であり、本番ビルド/本番環境では決して有効化されない（クライアントは `import.meta.env.DEV` でガードしてビルドから除去、サーバは本番 Pages env に `AUTH_MOCK` を設定しない）。

## Constraints
- 実装は Cloudflare Pages Functions（Workers ランタイム）。`jose` は Workers/Node 両対応。
- ライブのログイン検証には **Google OAuth クライアント ID**（Google Cloud Console で発行、承認済み JS 生成元に `https://libcheck.pages.dev` と `http://localhost:5173`）が必要。発行はユーザーの手元作業。
- ID トークンは短命（約1時間）。長期セッションは本 Phase の対象外。

## Acceptance Criteria
- AC-1: クライアント ID 設定済みの環境で、Google サインイン→ユーザー名表示→サインアウトができる。
- AC-2: `/api/me` が、有効トークンで 200 + user 情報、無効/無トークンで 401 を返す（検証ロジックを単体テストで担保）。
- AC-3: 未ログインでも検索〜登録の既存フローが動く。
- AC-4: シークレット/クライアントIDの実値がリポジトリに含まれない。
- AC-5: 型チェック・全テストがグリーン。

## User Stories
- US-1: 利用者として、Google でログインして自分を識別させ、将来どの端末でも自分の登録図書館を使えるようにしたい（#74 への布石）。
- US-2: 利用者として、ログインしなくても今までどおり検索だけは使いたい。
