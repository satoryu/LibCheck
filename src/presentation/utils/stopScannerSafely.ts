import type { IScannerControls } from '@zxing/browser';

/**
 * スキャナ（カメラ）を停止する。停止処理の失敗は握りつぶす（#175）。
 *
 * `IScannerControls.stop` の型は `() => void` だが、トーチ対応端末では
 * `@zxing/browser` が async 関数（トラック停止 → torch OFF）に差し替える。
 * 停止済みトラックへの torch OFF は reject し得る（Chrome: "setPhotoOptions
 * failed"）ため、同期 throw に加えて返り値の Promise の reject も処理済みにする。
 * いずれの場合もカメラ自体は停止しているので、利用者への通知は不要。
 */
export function stopScannerSafely(
  controls: Pick<IScannerControls, 'stop'>,
): void {
  let result: unknown;
  try {
    result = controls.stop();
  } catch {
    return;
  }
  if (isThenable(result)) {
    result.then(undefined, () => {});
  }
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}
