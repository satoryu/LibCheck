// vite.config.ts の runtimeCaching.cacheName と一致させること。
export const OFFLINE_API_CACHE_NAME = 'api-user-data';

/**
 * ログアウト時に呼ぶ。#143 で追加した登録図書館・検索履歴のオフライン用
 * Cache Storage を削除し、同じ端末で次にログインする別ユーザーへ前ユーザーの
 * キャッシュが漏れるのを防ぐ。Cache Storage 非対応環境では何もしない。
 */
export async function clearOfflineApiCache(): Promise<void> {
  if (typeof caches === 'undefined') return;
  await caches.delete(OFFLINE_API_CACHE_NAME);
}
