import { useEffect, useState } from 'react';

/**
 * ブラウザのオンライン/オフライン状態を購読する（#145）。
 *
 * `navigator.onLine` は「ネットワークインターフェースが繋がっているか」の
 * 判定であり「実際にサーバへ到達できるか」の保証ではない（Wi-Fi 接続だが
 * インターネットには出られない、等では false positive になり得る）点に注意。
 * それでも「明確にオフラインである」ケースを一般的なサーバーエラーと
 * 区別するための一次情報として用いる。
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
