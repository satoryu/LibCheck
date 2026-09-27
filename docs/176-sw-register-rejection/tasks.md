# 実装タスク: Service Worker 登録失敗の未処理 rejection の解消（#176）

TDD（失敗するテストを書く → 実装 → 必要ならリファクタ）で上から順に進める。

## 1. 登録モジュール

- [x] `src/pwa/registerServiceWorker.test.ts`: SW 非対応環境では何もしない（例外なし）
- [x] 同: `load` 前に呼ぶと、`load` 発火後に `/sw.js`・スコープ `/` で 1 回登録する
- [x] 同: `load` 済み（`readyState === 'complete'`）で呼ぶと即座に登録する
- [x] 同: `register` が reject しても未処理 rejection にならず、`console.warn` を出す（`collectUnhandledRejections` を使い、reject を返すモックは素の関数で書く）
- [x] `src/pwa/registerServiceWorker.ts` を実装

## 2. 組み込み

- [x] `pwa.test.ts`: 回帰ガードを「`injectRegister: false`」「`main.tsx` が `registerServiceWorker()` を呼ぶ」に更新（先に失敗させる）
- [x] `vite.config.ts` を `injectRegister: false` に変更しコメント更新
- [x] `src/main.tsx` から `registerServiceWorker()` を呼ぶ（`import.meta.env.PROD` のときのみ。dev で存在しない `/sw.js` を登録しないため）
- [x] 関連コメント（`src/analytics/gtag.ts` の「PWA の registerSW と同じ方針」）を実態に合わせて更新

## 3. 検証

- [x] `npm test` / `npx tsc -b` / `npm run build` が通る
- [x] `dist/index.html` に `registerSW.js` の script タグが無く、`dist/registerSW.js` が生成されないことを確認
- [x] ブラウザ検証（build + preview）: SW が登録され `waiting` に留まらない / `register` を reject させても `unhandledrejection` が 0 件
- [x] 旧方式 → 新方式の更新検証（main のビルドで SW を入れた状態から本ブランチのビルドへ切り替え、`getRegistration()` が `active` のみになる）
- [x] PR 作成・セルフレビュー（#178。型の絞り込みと本番限定登録の回帰ガードを追加）
- [ ] マージ → デプロイ監視 → `scripts/smoke.sh` → 本番で `getRegistration()` 確認 → Sentry の LIBCHECK-4 / 8 / 9 を resolved にして再発監視
