import { afterEach, describe, expect, test, vi } from 'vitest';
import * as Sentry from '@sentry/react';
import type { Event, StackFrame } from '@sentry/react';

import { initSentry, SENTRY_DENY_URLS } from '@/sentry';

// init だけ差し替え、eventFiltersIntegration などは SDK の実装を使う。
vi.mock('@sentry/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sentry/react')>()),
  init: vi.fn(),
}));

const GIS_CLIENT = 'https://accounts.google.com/gsi/client';
const APP_BUNDLE = 'https://libcheck.app/assets/index-BqpzwpNC.js';

/** 外側 → 内側（最後が throw した箇所）の順でフレームを並べたイベントを作る。 */
function makeEvent(filenames: string[]): Event {
  const frames: StackFrame[] = filenames.map((filename) => ({ filename }));
  return {
    exception: {
      values: [
        {
          type: 'Error',
          value: 'pa',
          mechanism: {
            type: 'auto.browser.browserapierrors.xhr.onreadystatechange',
            handled: false,
          },
          stacktrace: { frames },
        },
      ],
    },
  };
}

type EventFilters = ReturnType<typeof Sentry.eventFiltersIntegration>;
// @sentry/react は Client 型を export しないため、processEvent の引数から取る。
type Client = Parameters<NonNullable<EventFilters['processEvent']>>[2];

/**
 * SDK の実フィルタ（eventFiltersIntegration）に denyUrls を与えてイベントを通す。
 * 破棄されると null が返る。
 */
function filter(event: Event): Event | null | PromiseLike<Event | null> {
  const client = {
    getOptions: () => ({ denyUrls: SENTRY_DENY_URLS }),
  } as unknown as Client;
  const integration = Sentry.eventFiltersIntegration();
  return integration.processEvent!(event, {}, client);
}

describe('SENTRY_DENY_URLS', () => {
  // #179: LIBCHECK-5/6/7。GIS の XHR ハンドラ内で GIS 自身が throw した例外。
  // 外側に Sentry の XHR ラッパ（自バンドル）があり、最内フレームが gsi/client。
  test('最内フレームが GIS スクリプトの例外は破棄する', () => {
    const event = makeEvent([APP_BUNDLE, APP_BUNDLE, GIS_CLIENT, GIS_CLIENT]);

    expect(filter(event)).toBeNull();
  });

  test('GIS から呼ばれた自コードで throw した例外（最内フレームが自バンドル）は送る', () => {
    const event = makeEvent([GIS_CLIENT, GIS_CLIENT, APP_BUNDLE]);

    expect(filter(event)).toBe(event);
  });

  test('自バンドルのみの例外は送る', () => {
    const event = makeEvent([APP_BUNDLE, APP_BUNDLE]);

    expect(filter(event)).toBe(event);
  });

  test('ホスト名が似た別ドメインや、パスに gsi を含む自サイトの URL は巻き込まない', () => {
    for (const url of [
      'https://accounts.google.com.evil.example/gsi/client',
      'https://libcheck.app/accounts.google.com/gsi/client.js',
    ]) {
      const event = makeEvent([APP_BUNDLE, url]);
      expect(filter(event), url).toBe(event);
    }
  });
});

describe('initSentry', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(Sentry.init).mockClear();
  });

  test('DSN があれば denyUrls を渡して初期化する', () => {
    const init = vi.mocked(Sentry.init);
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@o0.ingest.sentry.io/0');
    vi.stubEnv('DEV', false);

    initSentry();

    expect(init).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        sendDefaultPii: false,
        denyUrls: SENTRY_DENY_URLS,
      }),
    );
  });
});
