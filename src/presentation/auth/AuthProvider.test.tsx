import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/presentation/auth/AuthProvider';
import type { SessionApi } from '@/data/datasources/sessionApiClient';
import type { User } from '@/domain/models/user';

const alice: User = { id: 'u1', name: 'Alice', email: 'a@example.com' };

/** ネットワークを使わない no-op セッション（既定は未復元）。 */
function fakeSession(overrides: Partial<SessionApi> = {}): SessionApi {
  return {
    restore: async () => null,
    create: async () => {},
    destroy: async () => {},
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider sessionApi={fakeSession()}>{children}</AuthProvider>;
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

describe('AuthProvider セッション（#91）', () => {
  it('マウント時に restore でセッションを復元する', async () => {
    const session = fakeSession({ restore: async () => alice });
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider sessionApi={session}>{children}</AuthProvider>
      ),
    });
    await waitFor(() => expect(result.current.user).toEqual(alice));
  });

  it('initialUser がある場合は restore しない', () => {
    const restore = vi.fn(async () => alice);
    renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider initialUser={alice} sessionApi={fakeSession({ restore })}>
          {children}
        </AuthProvider>
      ),
    });
    expect(restore).not.toHaveBeenCalled();
  });

  it('signIn は create、signOut は destroy を呼ぶ', async () => {
    const create = vi.fn(async () => {});
    const destroy = vi.fn(async () => {});
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthProvider sessionApi={fakeSession({ create, destroy })}>
          {children}
        </AuthProvider>
      ),
    });

    act(() => result.current.signIn(alice, 'idtok'));
    expect(create).toHaveBeenCalledWith('idtok');

    act(() => result.current.signOut());
    expect(destroy).toHaveBeenCalled();
  });
});
