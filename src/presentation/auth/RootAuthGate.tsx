import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/presentation/auth/AuthProvider';
import { PUBLIC_PATHS, isPublicPath } from '@/presentation/auth/publicPaths';
import { LandingPage } from '@/presentation/landing/LandingPage';

export interface RootAuthGateProps {
  /** テスト用の注入ポイント。本番は既定の `PUBLIC_PATHS`（#157時点では空）を使う。 */
  publicPaths?: readonly string[];
}

/**
 * 必須ログインのゲート（#157 で `AuthGate` から置き換え）。
 *
 * `createAppRouter()` が組み立てる実アプリ専用ルーターの最上位 pathless
 * layout route として使う。`routes`（`router.tsx` がテストとも共有する
 * 配列）自体はゲートしない設計上の理由は design.md を参照。
 *
 * 現在のパスが `isPublicPath()` で公開ルートと判定されればログイン状態に
 * 関わらず子ルート（`<Outlet/>`）を描画し、それ以外は未ログイン時のみ
 * ランディング（紹介＋ログイン誘導）を表示する。ログアウト時（user が
 * null になったとき）は React Query キャッシュをクリアし、別ユーザーの
 * データ混在を防ぐ。
 */
export function RootAuthGate({
  publicPaths = PUBLIC_PATHS,
}: RootAuthGateProps): JSX.Element {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user === null) queryClient.clear();
  }, [user, queryClient]);

  if (user === null && !isPublicPath(location.pathname, publicPaths)) {
    return <LandingPage />;
  }
  return <Outlet />;
}
