# #87 セキュリティ強化（M-2 / L-1）— Requirements

## Problem Statement

2026-06-27 のセキュリティレビューで、認証・データ隔離（サーバ側 ID トークン検証、`user_id` スコープ）は健全と確認できた一方、対応すべき2点が残った。

- **M-2**: セキュリティヘッダ（CSP 等）が未設定。将来の XSS でメモリ上の ID トークンが外部送信される経路や、クリックジャッキングへの多層防御が無い。
- **L-1**: 永続化エンドポイントの PUT が入力検証・サイズ制限を持たず、巨大/不正ペイロードを受け入れる（自分の行範囲に限るがコスト/DoS・整合性リスク）。

## Requirements

### Functional

- FR-1: 本番配信に CSP / X-Content-Type-Options / Referrer-Policy / Permissions-Policy / frame-ancestors（クリックジャッキング対策）を付与する。
- FR-2: CSP は実依存（GIS・OpenBD・Amazon 画像・`/api/*`）と整合し、Google ログイン・バーコードカメラ・書影表示を壊さない。
- FR-3: `/api/registered-libraries`・`/api/search-history` の PUT は本文サイズ上限を超えると 413 を返す。
- FR-4: 同 PUT は配列長上限を超えると 413 を返す。
- FR-5: 同 PUT は各要素の必須フィールド（library: `systemId`/`libKey`/`libId`、history: `isbn`/`searchedAt`）を検証し、不正なら 400 を返す。
- FR-6: 正常系（既存のラウンドトリップ・全置換）は従来どおり動作する。

### Non-Functional

- NFR-1: ヘッダは Cloudflare Pages の `public/_headers` で静的配信に付与し、アプリコードを増やさない。
- NFR-2: 検証ロジックは純粋関数として切り出し、ユニットテスト可能にする（TDD）。
- NFR-3: CALIL_APP_KEY 等の秘密や挙動に影響しない。

## Constraints

- CSP はホワイトリスト方式。インラインスタイル（MUI/emotion・GIS）に対応するため `style-src 'unsafe-inline'` を許容する（`script-src` は `'unsafe-inline'` を付けない＝インラインスクリプトは index.html に無い）。
- Google ログイン（GIS）の CSP 要件（`https://accounts.google.com/gsi/*`）を満たす。
- 本番の `public/_headers` 効果は Vite dev では再現されない（Pages 配信機能）。ブラウザ確認は本番相当（`npm run pages:dev` か本番）で行う。

## Acceptance Criteria

- AC-1: `public/_headers` が存在し、CSP に `frame-ancestors 'none'` / `object-src 'none'` / `base-uri 'self'`、`connect-src` に `https://api.openbd.jp`、GIS 用 `script-src`/`frame-src`/`connect-src`/`style-src` を含む。
- AC-2: PUT に 1MB 超の本文 → 413、上限超の配列 → 413、必須フィールド欠落の要素 → 400。
- AC-3: 既存の persistence テスト（ラウンドトリップ・全置換・不正 body 400）が引き続き緑。
- AC-4: 検証純粋関数のユニットテストが緑。
- AC-5: `npx tsc -b` / `npm test` 緑。
- AC-6（手動）: 本番相当で Google ログイン・カメラスキャン・書影表示が CSP 下で動作し、コンソールに CSP 違反が出ない。

## User Stories

- 利用者として、万一の XSS でも被害が広がりにくいアプリを使いたい（CSP による多層防御）。
- 運用者として、不正・過大な書き込みでストレージやコストが浪費されないようにしたい。
