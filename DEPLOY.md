# LibCheck Web — ローカル実行 & Azure Static Web Apps デプロイ

Calil の API キーは **サーバ側でのみ** 注入されます。クライアントのバンドルにも、ブラウザ→自前
オリジン間の通信にもキーは含まれません。

- 本番: Azure Static Web Apps の組み込み API(Azure Functions, `api/`)が `/api/calil/*` を
  Calil API へプロキシし、`CALIL_APP_KEY`(Application Setting)で `appkey` を上書きします。
- ローカル: 用途に応じて 2 通り。

## 構成

```
.                                # リポジトリルート(= SWA の App location)
├── src/                         # React フロントエンド
├── public/
│   └── staticwebapp.config.json # SWA ルーティング(SPA フォールバック / /api 除外)
├── api/                         # Azure Functions(API バックエンド)
│   ├── host.json
│   ├── package.json
│   └── src/functions/calilProxy.js  # /api/calil/{action} プロキシ
└── ...
```

クライアントは全環境で同一オリジンの `/api/calil/library` `/api/calil/check` を呼びます。

## ローカル実行

### A) Vite 開発サーバ(HMR・日常開発向け / Azure ツール不要)

```bash
cp .env.local.example .env.local   # CALIL_APP_KEY=... を記入(VITE_ プレフィックス無し)
npm run dev                        # http://localhost:5173
```

`vite.config.ts` の dev proxy が本番 Functions と同じく `/api/calil` を Calil へ転送し、`appkey`
をサーバ側(設定ファイル内)で注入します。キーはブラウザに出ません。

### B) SWA CLI(本番と同一構成での確認向け)

実際の SWA(静的配信 + Functions API + ルーティング)をローカルでエミュレートします。
Azure Functions Core Tools(`func`)が必要です。

```bash
cp api/local.settings.json.example api/local.settings.json   # CALIL_APP_KEY=... を記入
cd api && npm install && cd ..

npm run swa:start    # build → swa start dist --api-location api(既定 http://localhost:4280）
```

> Functions Core Tools 未導入の場合: `npm i -g azure-functions-core-tools@4 --unsafe-perm true`
> もしくは日常開発は A) の Vite proxy で十分です(挙動は同一)。

## デプロイ(Azure Static Web Apps)

### 1. リソース作成 & キー登録
1. Azure ポータルで **Static Web App** を作成(GitHub 連携)。
2. 作成時のビルド設定(または `.github/workflows/azure-static-web-apps.yml` に反映済み):
   - App location: `/`
   - Api location: `api`
   - Output location: `dist`
3. **Configuration → Application settings** に `CALIL_APP_KEY` を追加(本番シークレット)。
   ※ ここで設定した値は Functions の `process.env.CALIL_APP_KEY` として参照され、クライアントには
   配信されません。

### 2. デプロイトークン
GitHub リポジトリの Secrets に `AZURE_STATIC_WEB_APPS_API_TOKEN`(SWA の Deployment token)を登録。
`main` へのマージ(push)で `.github/workflows/azure-static-web-apps.yml` が本番環境へ自動デプロイ
します(手動実行も workflow_dispatch で可能)。PR 時の検証(型チェック・テスト)は `ci.yml` が
行います。

### 3. Amazon アソシエイトタグ(任意)
書籍検索結果の「Amazonで見る」リンクをアフィリエイトリンクにする場合、GitHub リポジトリの
**Variables**(Secrets ではなく Variables)に `AMAZON_ASSOCIATE_TAG`(例: `libcheck-22`)を登録します。
本番ビルド時に `VITE_AMAZON_ASSOCIATE_TAG` として注入され、リンクに `tag=` が付与されます。
未設定なら通常リンクのまま。タグは URL に現れる公開値のため Secret ではなく Variable で管理します。
ローカル開発(`.env.local` 未設定)では常に通常リンクになります。

現在のデプロイ先リソース:

- リソースグループ: `rg-libcheck` (East Asia)
- Static Web App: `libcheck` (Free プラン)

### 手動デプロイ(任意, SWA CLI)
```bash
npm run build
swa deploy ./dist --api-location ./api --deployment-token <token>
```

## セキュリティ上のポイント

- クライアント設定 `src/data/datasources/calilApiConfig.ts` は `appKey: ''` 固定で `VITE_` 環境変数を
  読みません。`VITE_CALIL_APP_KEY` を設定してビルドしてもキーはバンドルに混入しません(検証済み)。
- Functions プロキシは `library` / `check` のみ・GET のみを許可し、`appkey` をクライアント値に
  関係なくシークレットで上書きします。レスポンスは `cache-control: no-store`。
- `staticwebapp.config.json` の `navigationFallback` は `/api/*` を除外しているため、API 経路が
  SPA フォールバックに飲み込まれません。
