import { afterEach, beforeEach } from 'vitest';

/**
 * 各テスト中に発生した未処理 Promise rejection を集める（#175）。
 * `describe` 内で呼ぶと、そのブロックの各テストの前後で監視を張り替える。
 *
 * 注意: `vi.fn` は戻り値の Promise に自前で `then` を付けて結果を記録する
 * （settledResults）ため、reject を返すモックを `vi.fn` で作ると、それだけで
 * 「処理済み」になり検出できない。reject を返すモックは素の関数で書くこと。
 */
export function collectUnhandledRejections(): {
  readonly reasons: unknown[];
  flush: () => Promise<void>;
} {
  const reasons: unknown[] = [];
  const onUnhandled = (reason: unknown): void => {
    reasons.push(reason);
  };

  beforeEach(() => {
    reasons.length = 0;
    process.on('unhandledRejection', onUnhandled);
  });

  afterEach(() => {
    process.off('unhandledRejection', onUnhandled);
  });

  return {
    reasons,
    /** Node が未処理 rejection を判定し終える（マイクロタスク消化後）まで待つ。 */
    flush: () => new Promise((resolve) => setTimeout(resolve, 0)),
  };
}
