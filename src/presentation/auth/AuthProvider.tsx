import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { User } from '@/domain/models/user';
import { setAuthToken } from '@/data/datasources/authTokenStore';
import {
  SessionApiClient,
  type SessionApi,
} from '@/data/datasources/sessionApiClient';

export interface AuthContextValue {
  /** ログイン中のユーザー。未ログインは null。 */
  user: User | null;
  /** ログイン中の ID トークン（保護 API への Bearer に使う）。未ログインは null。 */
  idToken: string | null;
  /** ユーザーと ID トークンをセットしてログイン状態にする。 */
  signIn: (user: User, idToken: string) => void;
  /** ログイン状態を解除する。 */
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 認証状態（ユーザー / ID トークン）をアプリ全体に提供する。
 *
 * セッションは HttpOnly Cookie で維持する（#91）。マウント時に `sessionApi.restore()`
 * （= GET /api/me）でセッションを復元するため、リロードしても再認証不要。`signIn` は
 * Cookie を発行（POST /api/session）、`signOut` は削除（DELETE /api/session）する。
 * ID トークンはアクティブセッション中のみメモリ保持（後方互換 Bearer）。
 * `initialUser` / `initialIdToken` はテスト用の初期状態注入（指定時は復元しない）。
 */
export function AuthProvider({
  children,
  initialUser = null,
  initialIdToken = null,
  sessionApi,
}: {
  children: ReactNode;
  initialUser?: User | null;
  initialIdToken?: string | null;
  sessionApi?: SessionApi;
}): JSX.Element {
  const [user, setUser] = useState<User | null>(initialUser);
  const [idToken, setIdToken] = useState<string | null>(initialIdToken);

  const session = useMemo<SessionApi>(
    () => sessionApi ?? new SessionApiClient(),
    [sessionApi],
  );

  // 現在の ID トークンを AuthTokenStore に同期（サーバー版リポジトリが参照）。
  useEffect(() => {
    setAuthToken(idToken);
  }, [idToken]);

  // マウント時にセッションを復元（initialUser 注入時はスキップ）。
  useEffect(() => {
    if (initialUser) return;
    let cancelled = false;
    void session.restore().then((restored) => {
      if (!cancelled && restored) setUser(restored);
    });
    return () => {
      cancelled = true;
    };
    // セッション復元は初回マウントのみ。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      idToken,
      signIn: (nextUser, nextToken) => {
        // 状態は同期的に反映（再レンダー後のクエリが古い/未設定トークンを読むのを防ぐ）。
        setAuthToken(nextToken);
        setUser(nextUser);
        setIdToken(nextToken);
        // セッション Cookie を発行（失敗は握りつぶす＝UI を壊さない）。
        void session.create(nextToken).catch(() => {});
      },
      signOut: () => {
        setAuthToken(null);
        setUser(null);
        setIdToken(null);
        void session.destroy().catch(() => {});
      },
    }),
    [user, idToken, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
