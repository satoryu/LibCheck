# 実装タスク: 地域ページにログインなしの体験版（#183）

TDD で進める（失敗するテストを先に書く → 実装 → リファクタ）。各タスク完了ごとにチェックする。

## 1. 上限の初期値の確定

- [x] 初期値で開始する（全体 300書籍リクエスト/時・接続元 5回/時・1回5システム）。2026-10-10 ユーザー判断。本番 D1 での見積もりは行わず、リリース後に `trial_usage` の実績を見て調整する
- [x] ログインユーザー側の check へのサーバキャッシュは別Issue #186 に切り出した

## 2. D1 マイグレーションと上限管理 `trialLimiter.js`

- [ ] `infra/d1/migrations/0002_trial_usage.sql` を追加
- [ ] `trialLimiter.test.ts` に失敗するテストを書く（D1 はフェイク）
  - 接続元の上限内なら ok、超えたら `reason: 'ip'` で全体の枠を消費しない
  - 全体の上限を超えたら `reason: 'global'`
  - 時間バケットが変われば数え直す
  - 2時間より古い行を削除する文を同じ batch で発行する
- [ ] 実装してテストを通す

## 3. 対象システムの選定 `trialTargets.js`

- [ ] テスト: 公共図書館優先・最大5システム・外れた館数・1システムの市区町村
- [ ] 実装

## 4. カーリル check のポーリング `calilCheck.js`

- [ ] テスト（fetch はフェイク）: 2秒間隔で `continue` が 0 になるまで／最大回数で打ち切り `complete: false`／HTTP エラー
- [ ] 実装

## 5. エンドポイント `POST /api/trial/check`

- [ ] `functions/api/trial/check.test.ts` に失敗するテストを書く
  - 正常系: 図書館ごとの状態・予約 URL を返す
  - 400: 不正な本文・不正な ISBN・未知の都道府県・0館の市区町村（カーリルを呼ばない）
  - 429: 接続元超過・全体超過（`Retry-After` 付き、カーリルを呼ばない）
  - キャッシュヒットは上限を消費せずカーリルも呼ばない
  - `TRIAL_IP_SALT` / `CALIL_APP_KEY` 未設定は 503 / 500
  - 既存 `/api/calil/check` は認証必須のまま（回帰）
- [ ] 実装してテストを通す

## 6. 配信 HTML に入口を追加

- [ ] `regionPageHtml.test.ts`: 市区町村ページに体験版の見出し・説明・入力欄があること
- [ ] 実装

## 7. SPA

- [ ] ドメインモデル `TrialCheckResult` とリポジトリ（interface / impl / client）＋テスト。`AppDependencies` と `makeFakeDeps` に追加
- [ ] `useTrialCheck` フック＋テスト
- [ ] `TrialCheckSection` ＋テスト（入力検証・送信・進捗・結果表示・カーリルへのリンク・予約リンク・上限到達時の案内・省略館数・登録への誘導）
- [ ] `LibraryListPage` に組み込み、既存テストが通ることを確認
- [ ] GA4 イベント `trial_check_submit` / `trial_check_result` を追加＋テスト

## 8. プライバシーポリシー

- [ ] ログイン必須の記述を改め、IP ハッシュの短期保存を追記

## 9. 全体確認

- [ ] `npm test` / `npx tsc -b` / `npm run build`
- [ ] `wrangler pages dev`（ローカル D1 にマイグレーション適用・`.dev.vars` に `TRIAL_IP_SALT`）で、正常系・キャッシュ・429（上限を一時的に下げて）・400 を `curl` で確認
- [ ] ブラウザ（コールドロード・未ログイン）で野洲市・可児市の体験版を実行し、結果・リンク・上限到達時の表示を確認。登録フローの回帰確認（`VITE_AUTH_MOCK=true`）
- [ ] 配信 HTML（JS 非実行）に入口があることを確認
- [ ] PR 作成・セルフレビュー
- [ ] #159 に本Issueでの判断を追記
- [ ] マージ前: 本番に `TRIAL_IP_SALT` を secret_text で登録（ユーザーと調整）、D1 マイグレーションは CI が適用
- [ ] マージ後: デプロイ監視 → `scripts/smoke.sh` → 本番で体験版を1回実行し、結果と `trial_usage` の加算を確認 → PR / Issue に記録
