# 実装タスク: GA4 によるユーザー価値到達のイベント計測（#169）

TDD（失敗するテストを書く → 実装 → 必要ならリファクタ）で上から順に進める。

## 1. 計測基盤

- [x] `src/analytics/gtag.test.ts`: 測定 ID 未設定なら script を挿入せず `trackEvent` が no-op
- [x] `src/analytics/gtag.test.ts`: 測定 ID ありで `gtag/js` script を 1 本だけ head に追加し、二重 init しない
- [x] `src/analytics/gtag.test.ts`: dev では `config` に `debug_mode: true`、prod ではパラメータを渡さない
- [x] `src/analytics/gtag.test.ts`: `trackEvent` が dataLayer に `event` を積む
- [x] `src/analytics/gtag.ts` を実装
- [x] `src/analytics/events.test.ts`: 4 関数のイベント名・パラメータ名を固定
- [x] `src/analytics/events.ts` を実装
- [x] `src/main.tsx` で `initAnalytics()` を呼ぶ

## 2. パラメータ算出

- [x] `src/presentation/utils/availabilityCounts.test.ts`: 0 件・全件貸出可・エラー混在・libKey 欠落・result undefined
- [x] `src/presentation/utils/availabilityCounts.ts` を実装

## 3. イベントの発火

- [x] `isbn_scan_success`: `BarcodeScannerPage.test.tsx` に「ISBN デコードで 1 回」「非 ISBN で 0 回」「オフライン保留で 0 回」
- [x] `BarcodeScannerPage.tsx` に発火を追加
- [x] `book_search_result_view`: `BookSearchResultPage.test.tsx` に「結果表示で 1 回＋カウント値」「再レンダリング/再試行で増えない」「登録0件・loading・error で 0 回」
- [x] `BookSearchResultPage.tsx` に `useTrackBookSearchResultView` を追加
- [x] `library_reservation_link_click`: `LibraryAvailabilityCard.test.tsx` に「予約するクリックで 1 回」「カーリルのリンクバックでは 0 回」
- [x] `LibraryAvailabilityCard.tsx` に発火を追加
- [x] `amazon_affiliate_link_click`: `BookMetadataCard.test.tsx` に「Amazonで見るクリックで 1 回」「カーリルで見るでは 0 回」
- [x] `BookMetadataCard.tsx` に発火を追加

## 4. 設定・配信・ドキュメント

- [x] `security-headers.test.ts` に GA4 ドメインのアサーションを追加
- [x] `public/_headers` の CSP を更新（`script-src` / `connect-src`）
- [x] `.github/workflows/cloudflare-pages.yml` に `VITE_GA_MEASUREMENT_ID` を追加
- [x] `vite.config.ts` の `test.env` に `VITE_GA_MEASUREMENT_ID: ''` を追加
- [x] `src/vite-env.d.ts` / `.env.local.example` に `VITE_GA_MEASUREMENT_ID` を追記
- [x] `public/privacy-policy.html` に GA4 と Cookie の記載を追加
- [x] `docs/roadmap.md` の #76「GA は見送り」記述を更新

## 5. 検証

- [x] `npx tsc -b`
- [x] `npm test`
- [x] `npm run build`
- [x] ブラウザ検証（dev サーバ、`VITE_AUTH_MOCK=true`）: 4 イベントがコンソールに出る
- [x] ブラウザ検証: `book_search_result_view` が結果画面で 1 回だけ（再試行・再レンダリング後も増えない）
- [x] ブラウザ検証: カメラ不可・許可拒否時にイベントが飛ばず、エラー UI が従来どおり

## 6. リリース

- [ ] PR 作成（Test Plan 付き）
- [ ] セルフレビューを PR にコメント
- [ ] `scripts/watch-pr.sh <PR> && gh pr merge <PR> --squash --delete-branch`
- [ ] 本番デプロイを `gh run watch` で確認
- [ ] `scripts/smoke.sh` が全 PASS
- [ ] 本番で CSP 違反が無いこと / `gtag/js` が読めること / GA4 に 4 イベントが届くこと
- [ ] 検証結果を PR・Issue に記録

## 検証メモ（実施結果）

- ブラウザ検証は Playwright + システムの Google Chrome（`channel: 'chrome'`）で実施。
  Playwright のパッケージ自体はプロジェクトに入れず、スクラッチ領域に入れて実行した
  （CLAUDE.md の「Playwright はローカルに入らない」は `npm install` 時の話で、
  `npx` / 別ディレクトリからは利用できた）。
- カメラのスキャン経路は、ISBN 9784003101018 の EAN-13 バーコードを描画した Y4M を生成し、
  Chrome の `--use-file-for-fake-video-capture` で擬似カメラに流して検証した。
- 本番相当（`npm run build` + `npm run preview`）では `dataLayer` が
  `["js", Date] / ["config", "G-..."]` となり **debug_mode が付かない**こと、
  実際に `https://www.google-analytics.com/g/collect?...&en=page_view` が送信されること、
  `[analytics]` のコンソール出力が出ないことを確認した。
