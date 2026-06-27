# #89 Calil プロキシ 認証必須化 + library キャッシュ — Requirements

## Problem Statement

`functions/api/calil/[action].js`（カーリル API プロキシ）は認証を要求せず、リクエストごとにサーバの `CALIL_APP_KEY` を注入して中継する。そのためインターネット上の誰でも、あなたのキーでカーリル API を叩ける（M-1）。キー自体は漏れないが、クォータ濫用・キー停止・無駄なコストの温床になる。

Cloudflare の Rate Limiting(A) は有料のため、低コストな組合せで残リスクを下げる:
- **C**: プロキシに認証を必須化し、匿名・偽トークンを上流到達前に弾く。
- **library キャッシュ**: 準静的な `library` 応答をキャッシュし、上流呼び出し（クォータ消費）を削減。

## Requirements

### Functional

- FR-1: `/api/calil/*` はトークン無し／無効トークンで **401** を返し、上流（カーリル）へ中継しない。
- FR-2: 有効な Google ID トークン（`AUTH_MOCK` 時はモックトークン）で従来どおり `library`/`check` を中継する。
- FR-3: クライアント（`CalilApiClient`）はログイン中の ID トークンを `Authorization: Bearer` で送る。未ログイン時はヘッダを付けない。
- FR-4: `library` 応答は `Cache-Control: public, max-age=...` を付け、Cloudflare Cache API でエッジキャッシュする（同一地域の再検索で上流を呼ばない）。
- FR-5: `check` 応答は従来どおり `no-store`（キャッシュしない）。
- FR-6: 認証はキャッシュ参照より前に行う（キャッシュヒットも認証必須）。

### Non-Functional

- NFR-1: 既存の `CalilApiClient` ユニットテスト（トークン未設定）は無改変で緑のまま。
- NFR-2: ローカル dev（`/api/calil` は Vite proxy 経由で Function を通らない）は従来どおり動く。
- NFR-3: Cache API はテスト環境（`caches` 不在）でも安全にスキップされる。

## Constraints

- 新規シークレット・有料機能を増やさない（既存の認証基盤と Cache API のみ）。
- データ隔離・`CALIL_APP_KEY` のサーバ専用性は不変。

## Acceptance Criteria

- AC-1: 本番 `/api/calil/library`・`/api/calil/check` がトークン無しで 401。
- AC-2: 有効トークンで 200・従来のレスポンス。`library` に `Cache-Control: public`、`check` に `no-store`。
- AC-3: `CalilApiClient` はトークンがあるとき Bearer を送る（テストで検証）。
- AC-4: 既存テスト + 新規テストが緑、`npx tsc -b` 緑。

## User Stories

- 運用者として、自分のカーリルキーが見知らぬ第三者に使い回されない状態にしたい。
- 利用者として、同じ地域の図書館一覧の再取得が速く、無駄な API 消費が起きないようにしたい。

## Out of Scope（将来）

- per-user / per-IP レート制限（KV/D1）、ログイン許可リスト、ID トークン失効時(〜1h)の検索 401 に対する自動再取得。
