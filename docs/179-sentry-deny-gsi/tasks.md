# 実装タスク: Google Identity Services 内部の例外を Sentry 送信から除外する（#179）

TDD（失敗するテストを書く → 実装 → 必要ならリファクタ）で上から順に進める。

## 1. 除外パターン

- [x] `src/sentry.test.ts`: LIBCHECK-6 と同じフレーム構成のイベントが SDK の実フィルタで破棄される
- [x] 同: 最内フレームが自バンドルのイベント（GIS が外側にある場合を含む）は破棄されない
- [x] `src/sentry.ts` に `SENTRY_DENY_URLS` を追加

## 2. 初期化への適用

- [x] `src/sentry.test.ts`: `initSentry()` が `denyUrls: SENTRY_DENY_URLS` を `Sentry.init` に渡す
- [x] `initSentry()` で `denyUrls` を渡す

## 3. 検証

- [x] `npm test` / `npx tsc -b` / `npm run build` が通る
- [x] ブラウザでの E2E 確認（偽 GIS スクリプトを route で差し替えて throw、Sentry 送信を route で捕捉。main は送信・本ブランチは非送信、自サイト由来は両方送信）
- [ ] PR 作成・セルフレビュー
- [ ] マージ → デプロイ監視 → `scripts/smoke.sh` → 本番バンドルに除外パターンが含まれることを確認 → Sentry の LIBCHECK-5 / 6 / 7 を resolved にして再発監視
