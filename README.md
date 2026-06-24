# LibCheck

カメラでISBNのバーコードを撮影し、普段利用している図書館に蔵書があるかどうかを確認するWebアプリケーション。

## 対応環境

カメラを利用できるモダンブラウザ（スマートフォン・PC）。HTTPS もしくは `localhost` 上で動作します。
利用には Google アカウントでのログインが必要です（登録図書館・検索履歴を端末間で同期するため）。

## 技術スタック

- React 18 / TypeScript / [Vite](https://vitejs.dev/)
- [カーリル 図書館API](https://calil.jp/doc/api_ref.html)
- [MUI](https://mui.com/)（UI コンポーネント / `@emotion`）
- [TanStack Query](https://tanstack.com/query)（サーバ状態・非同期データ管理）
- [React Router v7](https://reactrouter.com/)（画面遷移）
- [@zxing/browser](https://github.com/zxing-js/browser)（バーコード読み取り）
- [notistack](https://notistack.com/)（スナックバー通知）
- Google 認証（[Google Identity Services](https://developers.google.com/identity) / [@react-oauth/google](https://github.com/MomenSherif/react-oauth)、ID トークンは [jose](https://github.com/panva/jose) でサーバ側検証）— **ログイン必須**
- [Cloudflare Pages](https://developers.cloudflare.com/pages/) + [Pages Functions](https://developers.cloudflare.com/pages/functions/)（静的配信 + API プロキシ / 認証 / 永続化 API）
- [Cloudflare D1](https://developers.cloudflare.com/d1/)（登録図書館・検索履歴をユーザー単位で永続化）

## プロジェクト構成

Clean Architecture に基づく3層構成。

```
.
├── index.html                  # エントリーHTML
├── src/
│   ├── main.tsx                # エントリーポイント
│   ├── App.tsx                 # アプリケーションルート
│   ├── app/                    # ルーター・DI（dependencies）
│   ├── domain/                 # ドメイン層
│   │   ├── models/             # ドメインモデル
│   │   ├── repositories/       # リポジトリインターフェース
│   │   ├── data/               # ドメインデータ（都道府県等）
│   │   └── utils/              # ISBN バリデーション等
│   ├── data/                   # データ層
│   │   ├── datasources/        # API クライアント
│   │   ├── repositories/       # リポジトリ実装
│   │   ├── models/             # レスポンスモデル
│   │   ├── providers/          # データ層プロバイダ
│   │   └── exceptions/         # カスタム例外
│   └── presentation/           # プレゼンテーション層
│       ├── pages/              # 画面
│       ├── widgets/            # 共通ウィジェット
│       ├── auth/               # 認証（Google ログイン・AuthProvider 等）
│       ├── hooks/              # UI 状態フック
│       ├── theme/              # テーマ・配色
│       └── utils/              # エラーメッセージ解決等
├── public/
│   └── _redirects              # Cloudflare Pages の SPA フォールバック
├── functions/                  # Cloudflare Pages Functions（Workers ランタイム）
│   ├── _shared/                # 共有（googleAuth: ID トークン検証）
│   └── api/
│       ├── calil/[action].js   # カーリル API プロキシ（library / check のみ許可）
│       ├── me.js               # ログインユーザー情報
│       ├── registered-libraries.js # 登録図書館の取得 / 保存（D1）
│       └── search-history.js   # 検索履歴の取得 / 保存（D1）
└── infra/
    ├── d1/migrations/          # D1 スキーマのマイグレーション（追加手順は infra/d1/README.md）
    └── *.bicep                 # 旧 Azure 用 IaC（撤去予定 #78）
```

カーリル API の `appkey` は **サーバ側でのみ** 注入され、クライアントのバンドルには含まれません。
登録図書館・検索履歴はログインユーザー単位で Cloudflare D1 に永続化されます。
詳細は [`DEPLOY.md`](./DEPLOY.md) を参照してください。

## セットアップ

```bash
# 依存パッケージのインストール
npm install
```

## 開発サーバ

```bash
cp .env.local.example .env.local   # CALIL_APP_KEY=... を記入
npm run dev                        # http://localhost:5173
```

本番と同一構成（静的配信 + Pages Functions）で確認したい場合は `npm run pages:dev`（Cloudflare Pages のローカルエミュレーション）を利用します。
手順の詳細は [`DEPLOY.md`](./DEPLOY.md) を参照してください。

## テスト

```bash
# ユニットテスト・コンポーネントテスト（Vitest + Testing Library）
npm test

# ウォッチモード
npm run test:watch

# 型チェック
npx tsc -b
```

## ビルド

```bash
# 型チェック + プロダクションビルド（出力先: dist/）
npm run build

# ビルド成果物のプレビュー
npm run preview
```

## デプロイ

`main` への push で `.github/workflows/cloudflare-pages.yml` が Cloudflare Pages へ自動デプロイします（デプロイ前に D1 マイグレーションを `--remote` で適用）。
PR では `ci.yml`（型チェック + テスト）と `d1-migrate.yml`（マイグレーションの `--local` 検証）が走ります。
リソース作成・シークレット登録・手動デプロイの手順は [`DEPLOY.md`](./DEPLOY.md)、スキーマ運用は [`infra/d1/README.md`](./infra/d1/README.md) を参照してください。

## コントリビューション

### ブランチ戦略

GitHub Flow を採用。

- `main`: プロダクションブランチ。テスト済み・レビュー済みのコードのみマージされる
- `feature/[ISSUE番号]-[短い説明]`: 機能開発用ブランチ。`main` から作成し、完了後 `main` へマージ

### 開発の流れ

1. GitHub Issue を作成、または既存の Issue を確認する
2. `main` から `feature/[ISSUE番号]-[短い説明]` ブランチを作成する
3. 実装する（テストも忘れずに）
4. `npm test` と `npx tsc -b` が通ることを確認する
5. PR を作成し、コードレビューを受ける
6. CI と Test Plan の全項目が完了したらマージする

### コーディング規約

- **アーキテクチャ**: Clean Architecture（domain / data / presentation の3層）。依存の向きは内側（domain）へ
- **状態管理**: TanStack Query によるサーバ状態管理 + カスタムフック
- **テスト**: TDD を原則とする。Vitest + Testing Library でユニットテスト・コンポーネントテストを作成
- **型チェック**: `npx tsc -b` でエラーが出ない状態を維持する

### コードレビューの観点

- Correctness（正しさ）
- Readability（読みやすさ）
- Performance（性能）
- Security（安全性）
- Maintainability（保守性）

### PR のマージ条件

- CI（型チェック + `npm test`）が通っていること
- Test Plan の全項目がチェック済みであること
- ブラウザでの手動確認が必要な項目はメンテナーの承認を得ること
