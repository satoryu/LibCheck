# 設計: スキャン終了時の未処理 rejection の解消（#175）

## Architecture Overview

停止処理を「同期 throw・非同期 reject の両方を握りつぶす」小さなユーティリティに集約し、
`BarcodeScannerPage` の停止呼び出し箇所すべてから使う。

```mermaid
flowchart LR
  A[BarcodeScannerPage] -->|stopCamera / キャンセル時| B[stopScannerSafely]
  B -->|controls.stop| C["@zxing/browser controls"]
  C -->|void| D[完了]
  C -->|throw| E[catch して無視]
  C -->|Promise reject| F[.catch して無視]
```

## Component Design

### `src/presentation/utils/stopScannerSafely.ts`（新規）

```ts
export function stopScannerSafely(controls: Pick<IScannerControls, 'stop'>): void
```

- `controls.stop()` を try/catch で呼ぶ。
- 戻り値が thenable（`then` 関数を持つ）なら `.then(undefined, () => {})` を付けて reject を処理済みにする。
- `IScannerControls.stop` の型は `() => void` のため、戻り値は `unknown` として受けて実行時に判定する。

### `BarcodeScannerPage.tsx`（変更）

- `stopCamera()` 内の `try { controlsRef.current.stop() } catch {}` を `stopScannerSafely(controlsRef.current)` に置き換える。
- 起動完了前にアンマウントされた場合の `controls.stop()` も `stopScannerSafely(controls)` に置き換える。

## Data Flow

```mermaid
sequenceDiagram
  participant Z as zxing decode callback
  participant P as BarcodeScannerPage
  participant S as stopScannerSafely
  participant C as controls (torch 対応)
  Z->>P: ISBN をデコード
  P->>S: stopCamera()
  S->>C: stop()
  C-->>S: Promise（トラック停止 → torch OFF で reject）
  S->>S: .then(undefined, noop) で処理済みに
  P->>P: navigate(/result/:isbn)
```

## Domain Models

ドメインモデルの変更はない（presentation 層のみの変更）。
