import { describe, expect, test, vi } from 'vitest';

import { stopScannerSafely } from '@/presentation/utils/stopScannerSafely';
import { collectUnhandledRejections } from '@/test/unhandledRejections';

describe('stopScannerSafely', () => {
  const unhandled = collectUnhandledRejections();

  test('同期で正常終了する stop を 1 回だけ呼ぶ', () => {
    const stop = vi.fn();

    stopScannerSafely({ stop });

    expect(stop).toHaveBeenCalledTimes(1);
  });

  test('stop が同期で throw しても例外を外へ漏らさない', () => {
    const stop = vi.fn(() => {
      throw new Error('stop failed');
    });

    expect(() => stopScannerSafely({ stop })).not.toThrow();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  // #175: トーチ対応端末では @zxing/browser の stop が async 関数に差し替わり、
  // トラック停止後の torch OFF が reject する（Chrome: "setPhotoOptions failed"）。
  // 型定義は `() => void` のため、実行時の戻り値で Promise を扱う必要がある。
  test('stop が reject する Promise を返しても未処理 rejection にしない', async () => {
    // reject を返すモックは vi.fn ではなく素の関数で書く（collectUnhandledRejections 参照）。
    // IScannerControls.stop の型（() => void）どおりに宣言しつつ、実行時は
    // zxing の実装と同じく Promise を返す。
    let calls = 0;
    const stop: () => void = () => {
      calls += 1;
      return Promise.reject(
        new DOMException('setPhotoOptions failed', 'UnknownError'),
      );
    };

    stopScannerSafely({ stop });
    await unhandled.flush();

    expect(calls).toBe(1);
    expect(unhandled.reasons).toEqual([]);
  });
});
