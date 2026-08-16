import { useEffect, useRef } from 'react';
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
 * ランディング（紹介＋ログイン誘導）を表示する。実際のログアウト
 * （ログイン済み→null への遷移）時は React Query キャッシュをクリアし、
 * 別ユーザーのデータ混在を防ぐ。
 *
 * 注意（#163）: `AuthProvider` は初回マウント時、セッション復元
 * （`GET /api/me`）が完了するまで必ず一瞬 `user: null` を返す。このゲート
 * を「null になったら常にクリア」という単純な実装にすると、#158 で公開に
 * なったルート（未ログインでも子要素＝データ取得を伴う画面を描画する）で、
 * マウント直後に子が開始したクエリを復元待ちの一瞬の null が巻き込んで
 * 壊してしまう（React Query の購読が壊れ「読み込み中」から進まなくなる）。
 * そのため「前回すでにログイン済みだった」場合に限りクリアする。
 */
export function RootAuthGate({
  publicPaths = PUBLIC_PATHS,
}: RootAuthGateProps): JSX.Element {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const previousUserRef = useRef(user);

  useEffect(() => {
    if (previousUserRef.current !== null && user === null) {
      queryClient.clear();
    }
    previousUserRef.current = user;
  }, [user, queryClient]);

  if (user === null && !isPublicPath(location.pathname, publicPaths)) {
    return <LandingPage />;
  }
  return <Outlet />;
}
