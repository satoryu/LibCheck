import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/presentation/auth/AuthProvider';
import { DependenciesProvider } from '@/app/dependencies';
import type { AppDependencies } from '@/app/dependencies';
import { makeFakeDeps } from '@/test/testUtils';
import type { SessionApi } from '@/data/datasources/sessionApiClient';
import type { User } from '@/domain/models/user';
import { OFFLINE_API_CACHE_NAME } from '@/presentation/utils/offlineCache';

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

/** AuthProvider は signOut のローカルデータ削除に deps を使うため注入する。 */
function makeWrapper(
  deps: AppDependencies = makeFakeDeps(),
  authProps: {
    sessionApi?: SessionApi;
    initialUser?: User | null;
    initialIdToken?: string | null;
  } = { sessionApi: fakeSession() },
) {
  return function wrapper({ children }: { children: ReactNode }) {
    return (
      <DependenciesProvider value={deps}>
        <AuthProvider {...authProps}>{children}</AuthProvider>
      </DependenciesProvider>
    );
  };
}

const wrapper = makeWrapper();

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
      wrapper: makeWrapper(makeFakeDeps(), {
        initialUser: alice,
        initialIdToken: 't0',
      }),
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
      wrapper: makeWrapper(makeFakeDeps(), { sessionApi: session }),
    });
    await waitFor(() => expect(result.current.user).toEqual(alice));
  });

  it('initialUser がある場合は restore しない', () => {
    const restore = vi.fn(async () => alice);
    renderHook(() => useAuth(), {
      wrapper: makeWrapper(makeFakeDeps(), {
        initialUser: alice,
        sessionApi: fakeSession({ restore }),
      }),
    });
    expect(restore).not.toHaveBeenCalled();
  });

  it('signIn は create、signOut は destroy を呼ぶ', async () => {
    const create = vi.fn(async () => {});
    const destroy = vi.fn(async () => {});
    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper(makeFakeDeps(), {
        sessionApi: fakeSession({ create, destroy }),
      }),
    });

    act(() => result.current.signIn(alice, 'idtok'));
    expect(create).toHaveBeenCalledWith('idtok');

    act(() => result.current.signOut());
    expect(destroy).toHaveBeenCalled();
  });
});

describe('AuthProvider オフラインキャッシュ削除（#143）', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('signOut は登録図書館・検索履歴のオフラインキャッシュを削除する（別ユーザーへの残存防止）', () => {
    const del = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('caches', { delete: del });

    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.signIn(alice, 'idtok'));

    act(() => result.current.signOut());

    expect(del).toHaveBeenCalledWith(OFFLINE_API_CACHE_NAME);
  });
});

describe('AuthProvider 保留スキャン削除（#144）', () => {
  it('signOut は保留スキャンキューを削除する（次ユーザーの履歴への自動保存を防ぐ）', async () => {
    // ログアウト時に保留キューが残ると、同一端末で次にログインした別ユーザーの
    // AppShell 常駐プロセッサが前ユーザーの ISBN を自動検索し、その別ユーザーの
    // サーバ側検索履歴（D1）へ保存してしまう（#143 のオフラインキャッシュ削除と
    // 同じ「別ユーザーへの残存防止」の一環）。
    const deps = makeFakeDeps();
    await deps.pendingScanRepository.add({
      isbn: '9784003101018',
      scannedAt: new Date(2026, 7, 1),
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper(deps),
    });
    act(() => result.current.signIn(alice, 'idtok'));

    act(() => result.current.signOut());

    await waitFor(async () => {
      expect(await deps.pendingScanRepository.getAll()).toHaveLength(0);
    });
  });
});
