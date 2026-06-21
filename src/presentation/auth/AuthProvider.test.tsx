import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/presentation/auth/AuthProvider';
import type { User } from '@/domain/models/user';

const alice: User = { id: 'u1', name: 'Alice', email: 'a@example.com' };

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider / useAuth', () => {
  it('初期状態は未ログイン', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.idToken).toBeNull();
  });

  it('signIn でユーザーとトークンがセットされ、signOut でクリアされる', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.signIn(alice, 'token-abc'));
    expect(result.current.user).toEqual(alice);
    expect(result.current.idToken).toBe('token-abc');

    act(() => result.current.signOut());
    expect(result.current.user).toBeNull();
    expect(result.current.idToken).toBeNull();
  });

  it('initialUser で初期ログイン状態を注入できる', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider initialUser={alice} initialIdToken="t0">
          {children}
        </AuthProvider>
      ),
    });
    expect(result.current.user).toEqual(alice);
    expect(result.current.idToken).toBe('t0');
  });

  it('Provider 外で useAuth を呼ぶと例外', () => {
    expect(() => renderHook(() => useAuth())).toThrow();
  });
});
