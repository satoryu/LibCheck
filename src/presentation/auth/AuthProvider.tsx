import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { User } from '@/domain/models/user';
import { setAuthToken } from '@/data/datasources/authTokenStore';

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
 * ID トークンはメモリ保持（リロードで消える＝GIS で再取得）。`initialUser` /
 * `initialIdToken` はテストやモック起動時の初期状態注入に使う。
 */
export function AuthProvider({
  children,
  initialUser = null,
  initialIdToken = null,
}: {
  children: ReactNode;
  initialUser?: User | null;
  initialIdToken?: string | null;
}): JSX.Element {
  const [user, setUser] = useState<User | null>(initialUser);
  const [idToken, setIdToken] = useState<string | null>(initialIdToken);

  // 現在の ID トークンを AuthTokenStore に同期（サーバー版リポジトリが参照）。
  useEffect(() => {
    setAuthToken(idToken);
  }, [idToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      idToken,
      signIn: (nextUser, nextToken) => {
        // トークンは同期的に反映する（再レンダー後のクエリが古い/未設定トークンを
        // 読むのを防ぐ。effect 同期はマウント時の initialIdToken 用）。
        setAuthToken(nextToken);
        setUser(nextUser);
        setIdToken(nextToken);
      },
      signOut: () => {
        setAuthToken(null);
        setUser(null);
        setIdToken(null);
      },
    }),
    [user, idToken],
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
