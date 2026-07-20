import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  clearOfflineApiCache,
  OFFLINE_API_CACHE_NAME,
} from '@/presentation/utils/offlineCache';

describe('clearOfflineApiCache（#143: ログアウト時のキャッシュ削除）', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Cache Storage 対応環境では登録図書館・検索履歴のキャッシュ名を指定して削除する', async () => {
    const del = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('caches', { delete: del });

    await clearOfflineApiCache();

    expect(del).toHaveBeenCalledWith(OFFLINE_API_CACHE_NAME);
  });

  it('Cache Storage 非対応環境（jsdom 既定）では何もせず解決する', async () => {
    await expect(clearOfflineApiCache()).resolves.toBeUndefined();
  });
});
