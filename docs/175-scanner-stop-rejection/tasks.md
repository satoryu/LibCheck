# 実装タスク: スキャン終了時の未処理 rejection の解消（#175）

TDD（失敗するテストを書く → 実装 → 必要ならリファクタ）で上から順に進める。

## 1. ユーティリティ

- [x] `src/presentation/utils/stopScannerSafely.test.ts`: 同期で正常終了する `stop` を 1 回呼ぶ
- [x] 同: 同期 throw しても例外が漏れない
- [x] 同: reject する Promise を返しても未処理 rejection にならない（`unhandledrejection` を監視して検証。`vi.fn` は戻り値の Promise を自前で処理済みにするため素の関数を使う）
- [x] `src/presentation/utils/stopScannerSafely.ts` を実装

## 2. ページへの適用

- [x] `BarcodeScannerPage.test.tsx`: トーチ対応端末（`stop` が reject する Promise を返す）で ISBN をデコードしても、結果ページへ遷移し未処理 rejection が起きない
- [x] `BarcodeScannerPage.tsx` の `stopCamera()` と起動前キャンセル時の停止を `stopScannerSafely` に置き換える

## 3. 仕上げ

- [x] `npm test` / `npx tsc -b` が通る（lint スクリプトは未定義。CI も tsc + test）
- [ ] PR 作成・セルフレビュー
- [ ] 実機（トーチ対応 Android）での確認は環境上できないため、ユニットテストと本番の Sentry 再発監視で代替する（PR の Test Plan に明記）
- [ ] マージ → デプロイ監視 → `scripts/smoke.sh` → Sentry で LIBCHECK-3 を「次のリリースで解決」に設定し再発監視
