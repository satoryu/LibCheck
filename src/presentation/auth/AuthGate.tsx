import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/presentation/auth/AuthProvider';
import { LandingPage } from '@/presentation/landing/LandingPage';

/**
 * 必須ログインのゲート。未ログインならランディング（紹介＋ログイン誘導）、
 * ログイン済みなら子を表示。ログアウト時は React Query キャッシュをクリアし、
 * 別ユーザーのデータ混在を防ぐ。
 *
 * App 直下（ルーターの外側）に置くため、テストの `renderRouteWithProviders` は
 * このゲートを通らず、既存のページ/ルートテストは無改変で動く。
 */
export function AuthGate({ children }: { children: ReactNode }): JSX.Element {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user === null) queryClient.clear();
  }, [user, queryClient]);

  if (user === null) {
    return <LandingPage />;
  }
  return <>{children}</>;
}
