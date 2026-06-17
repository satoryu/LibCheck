# Cloudflare 移設 Phase 1（機能パリティ） — Requirements

関連: 移設方針の決定は Cosense「LibCheck 2026/6/17」。後続フェーズ = #73 認証 / #74 永続化。Azure IaC #75 は役目終了。

## Problem Statement

LibCheck を Azure Static Web Apps（Free）から **Cloudflare（Pages + Pages Functions）** へ移設する。Phase 1 では**現行の機能をそのまま**載せ替え、認証(#73)・DB(#74)を積む前の土台を確定する。

移設理由（決定済み）: 自前 OIDC を採るなら SWA のマネージド認証の利点が消える／SWA は `Authorization` ヘッダを横取りしカスタムヘッダの癖を強いる／公開前で移設コストが最安。

現行構成（移設対象）:
- 静的配信: Vite ビルド（`dist`）を Azure SWA が配信。SPA フォールバックは `staticwebapp.config.json`。
- API: Azure Functions `api/src/functions/calilProxy.js`（`/api/calil/{action}`、`library`/`check` のみ許可、`CALIL_APP_KEY` をサーバー注入、`cache-control: no-store`）。
- ローカル: `vite` の dev proxy が `/api/calil` を `api.calil.jp` へ転送し `CALIL_APP_KEY`(非VITE) を注入。
- デプロイ: `azure-static-web-apps.yml`（main push、デプロイトークン方式）。アフィリエイトタグ `VITE_AMAZON_ASSOCIATE_TAG` をビルド時注入。

## Requirements

### Functional
- FR-1: Cloudflare Pages で静的サイト（React/Vite ビルド）を配信できる。
- FR-2: Calil プロキシを **Pages Functions**（`/api/calil/{action}`）で再実装し、`library`/`check` のみ許可・`CALIL_APP_KEY` をサーバー注入・`no-store` を維持する（現行 `calilProxy.js` と同等挙動）。
- FR-3: SPA フォールバック（未知パス→`index.html`、ただし `/api/*` と静的アセットは除外）を Cloudflare で実現する。
- FR-4: `main` への反映でビルド＋デプロイが走る（`VITE_AMAZON_ASSOCIATE_TAG` のビルド時注入を含む）。

### Non-Functional
- NFR-1: `CALIL_APP_KEY` をリポジトリに置かない（Cloudflare 側の環境変数／シークレットで注入）。
- NFR-2: クライアント設定（`calilApiConfig.baseUrl = '/api/calil'`）とフロントエンドのコードは原則変更しない（パスが同一で動く）。
- NFR-3: 既存の Vitest / 型チェックは維持・グリーン。
- NFR-4: ロールバック可能性: 移設検証が済むまで**稼働中の Azure 本番リソースは削除しない**（デコミッションは後続の明示ステップ）。

## Constraints
- Phase 1 では認証・DB は扱わない（#73/#74）。
- Pages Functions は Workers ランタイム（Node 完全互換ではない）。ただし `fetch`/`URL`/`Response` は native で、プロキシ実装に追加依存は不要。
- 完了には **Cloudflare アカウント**が必要（Pages プロジェクト作成・環境変数設定・デプロイ）。`wrangler login` 等はユーザーの手元実行。

## Acceptance Criteria
- AC-1: Cloudflare の `*.pages.dev` URL で、ホーム/各画面が表示される（SPA ルーティングが直アクセスでも動く）。
- AC-2: 図書館検索（`/api/calil/library`）と蔵書照会（`/api/calil/check`）が `*.pages.dev` 上で成功する（＝Pages Function 経由で Calil に到達、キーはサーバー注入）。
- AC-3: ローカル開発（`npm run dev`）で従来どおり検索が動く。
- AC-4: `CALIL_APP_KEY` がバンドル/リポジトリに含まれない。
- AC-5: 型チェック・全テストがグリーン。

## User Stories
- US-1: 開発者として、自前認証/DB を積む前に、ヘッダ横取りの癖が無い Cloudflare 上で現行機能が動くことを確認したい。
