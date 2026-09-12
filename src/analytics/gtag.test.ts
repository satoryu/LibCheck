import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * gtag.ts はモジュールスコープで初期化済みフラグを持つため、各テストで
 * `vi.resetModules()` してから動的 import する（本番コードにテスト用の
 * リセット関数を生やさないための方針）。
 */
async function importGtag(): Promise<typeof import('./gtag')> {
  vi.resetModules();
  return import('./gtag');
}

function gtagScripts(): HTMLScriptElement[] {
  return Array.from(
    document.querySelectorAll<HTMLScriptElement>(
      'script[src*="googletagmanager.com"]',
    ),
  );
}

/** dataLayer に積まれるのは arguments オブジェクトなので配列へ正規化する。 */
function dataLayerCalls(): unknown[][] {
  return (window.dataLayer ?? []).map((entry) =>
    Array.from(entry as ArrayLike<unknown>),
  );
}

describe('analytics/gtag', () => {
  beforeEach(() => {
    document.head.querySelectorAll('script').forEach((s) => s.remove());
    delete window.dataLayer;
    delete window.gtag;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('測定IDが未設定のとき（ローカル開発の既定）', () => {
    test('gtag.js を読み込まない', async () => {
      const { initAnalytics } = await importGtag();

      initAnalytics();

      expect(gtagScripts()).toHaveLength(0);
      expect(window.gtag).toBeUndefined();
    });

    test('trackEvent は送信せず例外も投げない', async () => {
      const { initAnalytics, trackEvent } = await importGtag();
      initAnalytics();

      expect(() => trackEvent('isbn_scan_success')).not.toThrow();
      expect(window.dataLayer).toBeUndefined();
    });
  });

  describe('測定IDが設定されているとき', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
    });

    test('gtag.js を測定ID付きで非同期読み込みする', async () => {
      const { initAnalytics } = await importGtag();

      initAnalytics();

      const scripts = gtagScripts();
      expect(scripts).toHaveLength(1);
      expect(scripts[0].src).toBe(
        'https://www.googletagmanager.com/gtag/js?id=G-TEST123',
      );
      expect(scripts[0].async).toBe(true);
    });

    test('js と config を dataLayer に積む', async () => {
      const { initAnalytics } = await importGtag();

      initAnalytics();

      const calls = dataLayerCalls();
      expect(calls[0][0]).toBe('js');
      expect(calls[0][1]).toBeInstanceOf(Date);
      expect(calls[1][0]).toBe('config');
      expect(calls[1][1]).toBe('G-TEST123');
    });

    test('2回呼んでも初期化は1回だけ', async () => {
      const { initAnalytics } = await importGtag();

      initAnalytics();
      initAnalytics();

      expect(gtagScripts()).toHaveLength(1);
      expect(
        dataLayerCalls().filter((call) => call[0] === 'config'),
      ).toHaveLength(1);
    });

    test('production では debug_mode パラメータを付けない', async () => {
      vi.stubEnv('DEV', false);
      const { initAnalytics } = await importGtag();

      initAnalytics();

      const config = dataLayerCalls().find((call) => call[0] === 'config');
      expect(config).toHaveLength(2);
    });

    test('development では debug_mode を付けて DebugView に出す', async () => {
      vi.stubEnv('DEV', true);
      const { initAnalytics } = await importGtag();

      initAnalytics();

      const config = dataLayerCalls().find((call) => call[0] === 'config');
      expect(config?.[2]).toEqual({ debug_mode: true });
    });

    test('trackEvent がイベント名とパラメータを送信する', async () => {
      const { initAnalytics, trackEvent } = await importGtag();
      initAnalytics();

      trackEvent('book_search_result_view', { searched_library_count: 3 });

      expect(dataLayerCalls()).toContainEqual([
        'event',
        'book_search_result_view',
        { searched_library_count: 3 },
      ]);
    });

    test('パラメータ無しのイベントは第3引数を渡さない', async () => {
      const { initAnalytics, trackEvent } = await importGtag();
      initAnalytics();

      trackEvent('isbn_scan_success');

      expect(dataLayerCalls()).toContainEqual(['event', 'isbn_scan_success']);
    });
  });

  describe('開発時の確認手段', () => {
    test('測定ID未設定でも development ではコンソールに出力する', async () => {
      vi.stubEnv('MODE', 'development');
      const info = vi.spyOn(console, 'info').mockImplementation(() => {});
      const { trackEvent } = await importGtag();

      trackEvent('amazon_affiliate_link_click');

      expect(info).toHaveBeenCalledWith(
        '[analytics]',
        'amazon_affiliate_link_click',
        undefined,
      );
    });

    test('テスト実行時（MODE=test）はコンソールを汚さない', async () => {
      const info = vi.spyOn(console, 'info').mockImplementation(() => {});
      const { trackEvent } = await importGtag();

      trackEvent('amazon_affiliate_link_click');

      expect(info).not.toHaveBeenCalled();
    });
  });
});
