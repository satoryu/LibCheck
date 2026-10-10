# 要件定義: libcheck.pages.dev へのアクセスを本番ドメインへ 301 転送する（#189）

## Problem Statement

Cloudflare Pages の既定ドメイン `libcheck.pages.dev` が、本番（`libcheck.app`）と同じデプロイを 200 で配信している（`www.libcheck.app` は 301 転送済み）。その結果:

- ボットを含む `pages.dev` へのアクセスが Sentry・アクセス解析に混じる（2026-09 の Sentry 棚卸しで確認）
- Google ログインが `pages.dev` で動くか未確定（2026-10-10 に確認。ボタンと Google 側の応答は両ドメインで同じだが、`pages.dev` でのみ FedCM のトークン取得エラーが出る。サインインしないと確定できない）。動かなければ離脱につながる
- canonical は `libcheck.app` を指しているが、ヒントにすぎず、同じ内容が2つのドメインで公開されている

## Requirements

### Functional

- **F1**: ホスト名がちょうど `libcheck.pages.dev` のリクエストは、同じパス・クエリのまま `https://libcheck.app` へ転送する。
  - GET / HEAD は 301（恒久的な移動。検索エンジンに正規ドメインを伝える）
  - それ以外のメソッドは 308（メソッドと本文を保つ。301 はブラウザが POST を GET に変えることがあるため）
- **F2**: プレビュー用のデプロイ（`<ハッシュ>.libcheck.pages.dev`、ブランチ別の `<ブランチ>.libcheck.pages.dev`）は転送しない。
- **F3**: `libcheck.app`（本番）とローカル開発（`localhost`）の動作は変えない。

### Non-Functional

- **NF1**: 設定はリポジトリで管理し、テストで検証できること。
- **NF2**: 転送は他の処理（静的配信・HTML の書き換え・API）より前に行い、余計な処理をしない。

## Constraints

- 既存の URL 構成は変えない。
- Cloudflare の設定変更（ダッシュボード・追加の API 権限）を必要としない方法を優先する。

## Acceptance Criteria

- **AC1**: 本番で `https://libcheck.pages.dev/<パス>?<クエリ>` が `https://libcheck.app/<パス>?<クエリ>` へ 301 で転送される（`curl` で確認。トップ・地域ページ・ガイド・sitemap.xml・静的アセット）。
- **AC2**: POST は 308 で転送される。
- **AC3**: PR のプレビュー用デプロイ URL は転送されず、従来どおり表示される。
- **AC4**: `libcheck.app` の動作に影響がない（`scripts/smoke.sh`・地域ページ・体験版・ガイド）。
- **AC5**: `npm test`・`npx tsc -b`・`npm run build` が通る。

## User Stories

- `libcheck.pages.dev` のリンクから来た人として、正しいドメインに案内され、ログインまで問題なく使いたい。
- 運営者として、エラー監視とアクセス解析を本番ドメインのデータだけにしたい。
