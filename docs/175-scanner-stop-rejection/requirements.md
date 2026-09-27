# 要件: スキャン終了時の未処理 rejection（setPhotoOptions failed）の解消（#175）

## Problem Statement

Sentry [LIBCHECK-3](https://sato-ryu.sentry.io/issues/LIBCHECK-3)（`UnknownError: setPhotoOptions failed`）が、
トーチ（ライト）対応の Android 端末で「スキャン成功 → 結果ページ遷移」のたびに発生している。

`@zxing/browser` はトーチ対応端末に限り `IScannerControls.stop` を async 関数
（`originalControls.stop()` → `switchTorch(false)`）に差し替える。トラック停止後の
`applyConstraints({ torch: false })` が reject するが、`BarcodeScannerPage` は `stop()` を
同期関数として扱っており（型定義も `() => void`）、reject が `onunhandledrejection` として
Sentry に送られている。カメラ自体は停止済みのため利用者に見える不具合はないが、
中核フローで毎回エラーが記録され、本当に対応すべきエラーを埋もれさせる。

## Requirements

### Functional

- FR-1: スキャナの停止処理が同期的に throw しても、Promise を返して reject しても、未処理の例外・rejection を発生させない。
- FR-2: 停止処理を呼ぶすべての経路（デコード成功時・アンマウント時・起動完了前のキャンセル時）に FR-1 を適用する。
- FR-3: 停止処理の失敗は利用者に通知しない（カメラ停止自体は完了しているため）。

### Non-Functional

- NFR-1: 既存のスキャン挙動（遷移・オフライン保留・トーチ切替・GA4 計測）を変えない。
- NFR-2: 依存ライブラリ（`@zxing/browser`）へのパッチは行わない。

## Constraints

- `IScannerControls.stop` の型は `() => void` だが、実行時には `Promise<void>` を返し得る。型に頼らず実行時の戻り値で判定する。
- Clean Architecture: 変更は `presentation` 層に閉じる。

## Acceptance Criteria

- AC-1: `stop()` が reject する Promise を返す端末を模したテストで、未処理 rejection が発生しない。
- AC-2: `stop()` が同期 throw するケースでも例外が漏れない（既存挙動の維持）。
- AC-3: ISBN デコード時に `stop()` が呼ばれ、結果ページへ遷移する（既存挙動の維持）。
- AC-4: 本番デプロイ後、LIBCHECK-3 が再発しない。

## User Stories

- 開発者として、Sentry に本当に対応が必要なエラーだけが並ぶようにしたい。それにより、利用者に影響する問題を見逃さずに済む。
