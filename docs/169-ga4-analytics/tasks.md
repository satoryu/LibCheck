# 実装タスク: GA4 によるユーザー価値到達のイベント計測（#169）

TDD（失敗するテストを書く → 実装 → 必要ならリファクタ）で上から順に進める。

## 1. 計測基盤

- [ ] `src/analytics/gtag.test.ts`: 測定 ID 未設定なら script を挿入せず `trackEvent` が no-op
- [ ] `src/analytics/gtag.test.ts`: 測定 ID ありで `gtag/js` script を 1 本だけ head に追加し、二重 init しない
- [ ] `src/analytics/gtag.test.ts`: dev では `config` に `debug_mode: true`、prod ではパラメータを渡さない
- [ ] `src/analytics/gtag.test.ts`: `trackEvent` が dataLayer に `event` を積む
- [ ] `src/analytics/gtag.ts` を実装
- [ ] `src/analytics/events.test.ts`: 4 関数のイベント名・パラメータ名を固定
- [ ] `src/analytics/events.ts` を実装
- [ ] `src/main.tsx` で `initAnalytics()` を呼ぶ

## 2. パラメータ算出

- [ ] `src/presentation/utils/availabilityCounts.test.ts`: 0 件・全件貸出可・エラー混在・libKey 欠落・result undefined
- [ ] `src/presentation/utils/availabilityCounts.ts` を実装

## 3. イベントの発火

- [ ] `isbn_scan_success`: `BarcodeScannerPage.test.tsx` に「ISBN デコードで 1 回」「非 ISBN で 0 回」「オフライン保留で 0 回」
- [ ] `BarcodeScannerPage.tsx` に発火を追加
- [ ] `book_search_result_view`: `BookSearchResultPage.test.tsx` に「結果表示で 1 回＋カウント値」「再レンダリング/再試行で増えない」「登録0件・loading・error で 0 回」
- [ ] `BookSearchResultPage.tsx` に `useTrackBookSearchResultView` を追加
- [ ] `library_reservation_link_click`: `LibraryAvailabilityCard.test.tsx` に「予約するクリックで 1 回」「予約リンク非表示時は 0 回」
- [ ] `LibraryAvailabilityCard.tsx` に発火を追加
- [ ] `amazon_affiliate_link_click`: `BookMetadataCard.test.tsx` に「Amazonで見るクリックで 1 回」「カーリルで見るでは 0 回」
- [ ] `BookMetadataCard.tsx` に発火を追加

## 4. 設定・配信・ドキュメント

- [ ] `security-headers.test.ts` に GA4 ドメインのアサーションを追加
- [ ] `public/_headers` の CSP を更新（`script-src` / `connect-src`）
- [ ] `.github/workflows/cloudflare-pages.yml` に `VITE_GA_MEASUREMENT_ID` を追加
- [ ] `vite.config.ts` の `test.env` に `VITE_GA_MEASUREMENT_ID: ''` を追加
- [ ] `src/vite-env.d.ts` / `.env.local.example` に `VITE_GA_MEASUREMENT_ID` を追記
- [ ] `public/privacy-policy.html` に GA4 と Cookie の記載を追加
- [ ] `docs/roadmap.md` の #76「GA は見送り」記述を更新

## 5. 検証

- [ ] `npx tsc -b`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] ブラウザ検証（dev サーバ、`VITE_AUTH_MOCK=true`）: 4 イベントがコンソールに出る
- [ ] ブラウザ検証: `book_search_result_view` が結果画面で 1 回だけ（再試行・再レンダリング後も増えない）
- [ ] ブラウザ検証: カメラ不可・許可拒否時にイベントが飛ばず、エラー UI が従来どおり

## 6. リリース

- [ ] PR 作成（Test Plan 付き）
- [ ] セルフレビューを PR にコメント
- [ ] `scripts/watch-pr.sh <PR> && gh pr merge <PR> --squash --delete-branch`
- [ ] 本番デプロイを `gh run watch` で確認
- [ ] `scripts/smoke.sh` が全 PASS
- [ ] 本番で CSP 違反が無いこと / `gtag/js` が読めること / GA4 に 4 イベントが届くこと
- [ ] 検証結果を PR・Issue に記録
