import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { stopScannerSafely } from '@/presentation/utils/stopScannerSafely';

/** Node が未処理 rejection を判定し終えるまで（マイクロタスク消化後）待つ。 */
function flushUnhandledRejections(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('stopScannerSafely', () => {
  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown): void => {
    unhandled.push(reason);
  };

  beforeEach(() => {
    unhandled.length = 0;
    process.on('unhandledRejection', onUnhandled);
  });

  afterEach(() => {
    process.off('unhandledRejection', onUnhandled);
  });

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
    // vi.fn は戻り値の Promise に自前で then を付けて結果を記録する
    // （settledResults）ため、それだけで rejection が「処理済み」になり
    // 検証にならない。素の関数で呼び出し回数を数える。
    let calls = 0;
    // IScannerControls.stop の型（() => void）どおりに宣言しつつ、実行時は
    // zxing の実装と同じく Promise を返す。
    const stop: () => void = () => {
      calls += 1;
      return Promise.reject(
        new DOMException('setPhotoOptions failed', 'UnknownError'),
      );
    };

    stopScannerSafely({ stop });
    await flushUnhandledRejections();

    expect(calls).toBe(1);
    expect(unhandled).toEqual([]);
  });
});
