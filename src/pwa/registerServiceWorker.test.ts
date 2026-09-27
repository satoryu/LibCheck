import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  registerServiceWorker,
  type ServiceWorkerEnv,
} from '@/pwa/registerServiceWorker';
import { collectUnhandledRejections } from '@/test/unhandledRejections';

type RegisterCall = { url: string; options: RegistrationOptions | undefined };

/**
 * テスト用の環境を組み立てる。`register` は vi.fn を使わず素の関数で
 * 呼び出しを記録する（reject を返すとき vi.fn だと rejection が処理済みに
 * なり検証にならないため。collectUnhandledRejections 参照）。
 */
function makeEnv(options: {
  readyState: DocumentReadyState;
  registerResult?: () => Promise<unknown>;
  withServiceWorker?: boolean;
}): {
  env: ServiceWorkerEnv;
  calls: RegisterCall[];
  fireLoad: () => void;
} {
  const calls: RegisterCall[] = [];
  const loadListeners: Array<() => void> = [];
  const register = (url: string, opts?: RegistrationOptions): Promise<unknown> => {
    calls.push({ url, options: opts });
    return (options.registerResult ?? (() => Promise.resolve({})))();
  };
  const navigator = (options.withServiceWorker ?? true)
    ? { serviceWorker: { register } }
    : {};
  const env = {
    navigator,
    window: {
      addEventListener: (type: string, listener: () => void) => {
        if (type === 'load') loadListeners.push(listener);
      },
    },
    document: { readyState: options.readyState },
  } as unknown as ServiceWorkerEnv;
  return {
    env,
    calls,
    fireLoad: () => loadListeners.forEach((l) => l()),
  };
}

describe('registerServiceWorker', () => {
  const unhandled = collectUnhandledRejections();

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('SW 非対応環境では何もしない（例外も出さない）', () => {
    const { env, calls, fireLoad } = makeEnv({
      readyState: 'loading',
      withServiceWorker: false,
    });

    expect(() => registerServiceWorker(env)).not.toThrow();
    fireLoad();

    expect(calls).toEqual([]);
  });

  test('load 前に呼ぶと load 発火後に /sw.js をスコープ / で 1 回登録する', () => {
    const { env, calls, fireLoad } = makeEnv({ readyState: 'interactive' });

    registerServiceWorker(env);
    expect(calls).toEqual([]);

    fireLoad();

    expect(calls).toEqual([{ url: '/sw.js', options: { scope: '/' } }]);
  });

  test('load 済み（readyState complete）で呼ぶと即座に登録する', () => {
    const { env, calls } = makeEnv({ readyState: 'complete' });

    registerServiceWorker(env);

    expect(calls).toEqual([{ url: '/sw.js', options: { scope: '/' } }]);
  });

  // #176: 生成スクリプト（registerSW.js）は catch が無く、SW を拒否・取得失敗
  // する環境で未処理 rejection として Sentry に送られていた（LIBCHECK-4/8/9）。
  test('register が reject しても未処理 rejection にせず、警告だけ出す', async () => {
    const { env, calls } = makeEnv({
      readyState: 'complete',
      registerResult: () =>
        Promise.reject(
          new DOMException(
            'Failed to register a ServiceWorker: An unknown error occurred when fetching the script.',
            'AbortError',
          ),
        ),
    });

    registerServiceWorker(env);
    await unhandled.flush();

    expect(calls).toHaveLength(1);
    expect(unhandled.reasons).toEqual([]);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});
