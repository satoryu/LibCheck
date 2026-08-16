import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { theme } from '@/theme';
import { DependenciesProvider } from '@/app/dependencies';
import { makeFakeDeps } from '@/test/testUtils';
import { AuthProvider, useAuth } from '@/presentation/auth/AuthProvider';
import { RootAuthGate } from '@/presentation/auth/RootAuthGate';
import type { User } from '@/domain/models/user';

/** #163 回帰テスト用: 実際にログアウト遷移（非null→null）を発生させるボタン。 */
function SignOutButton(): JSX.Element {
  const { signOut } = useAuth();
  return <button onClick={signOut}>sign out</button>;
}

/**
 * `RootAuthGate` はルーター内の pathless layout route として使う前提の
 * コンポーネントなので、`createMemoryRouter` で最小構成のツリーを組んで
 * テストする（design.md 参照）。
 */
function renderGate({
  user,
  initialPath = '/',
  publicPaths,
  queryClient,
}: {
  user: User | null;
  initialPath?: string;
  publicPaths?: readonly string[];
  queryClient?: QueryClient;
}) {
  const qc =
    queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const router = createMemoryRouter(
    [
      {
        element: <RootAuthGate publicPaths={publicPaths} />,
        children: [
          { path: '/', element: <div>HOME CONTENT</div> },
          { path: '/public-page', element: <div>PUBLIC CONTENT</div> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  );

  const result = render(
    <DependenciesProvider value={makeFakeDeps()}>
      <QueryClientProvider client={qc}>
        <ThemeProvider theme={theme}>
          <AuthProvider initialUser={user}>
            <RouterProvider router={router} />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </DependenciesProvider>,
  );

  return { ...result, queryClient: qc };
}

describe('RootAuthGate', () => {
  it('未ログイン・非公開パスはランディング（紹介）を表示する', () => {
    renderGate({ user: null, initialPath: '/' });

    expect(screen.getByText(/図書館にありますか/)).toBeInTheDocument();
    expect(screen.queryByText('HOME CONTENT')).not.toBeInTheDocument();
  });

  it('未ログインでも公開パスなら子要素（Outlet）を表示する', () => {
    renderGate({
      user: null,
      initialPath: '/public-page',
      publicPaths: ['/public-page'],
    });

    expect(screen.getByText('PUBLIC CONTENT')).toBeInTheDocument();
    expect(screen.queryByText(/図書館にありますか/)).not.toBeInTheDocument();
  });

  it('ログイン済みなら非公開パスでも子要素（Outlet）を表示する', () => {
    renderGate({ user: { id: 'u1', name: 'Alice' }, initialPath: '/' });

    expect(screen.getByText('HOME CONTENT')).toBeInTheDocument();
    expect(screen.queryByText(/図書館にありますか/)).not.toBeInTheDocument();
  });

  it('実際のログアウト（ログイン済み→null への遷移）で React Query キャッシュをクリアする', async () => {
    // #163 回帰テスト。「初回マウント時の未確定 null」ではなく、
    // 「ログイン済み状態からの明示的なサインアウト」を再現する。
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const clearSpy = vi.spyOn(queryClient, 'clear');
    const qc = queryClient;

    const router = createMemoryRouter(
      [
        {
          element: <RootAuthGate />,
          children: [{ path: '/', element: <SignOutButton /> }],
        },
      ],
      { initialEntries: ['/'] },
    );

    const user = userEvent.setup();
    render(
      <DependenciesProvider value={makeFakeDeps()}>
        <QueryClientProvider client={qc}>
          <ThemeProvider theme={theme}>
            <AuthProvider initialUser={{ id: 'u1', name: 'Alice' }}>
              <RouterProvider router={router} />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </DependenciesProvider>,
    );

    // マウント直後（ログイン済み）はクリアされない。
    expect(clearSpy).not.toHaveBeenCalled();

    await user.click(screen.getByText('sign out'));

    await waitFor(() => {
      expect(clearSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('初回マウント時の未確定 null（復元待ち）では React Query キャッシュをクリアしない（#163）', async () => {
    // AuthProvider は復元完了まで一瞬 user===null を返すが、これは
    // 「ログアウト」ではない。#158 で公開ルートがマウント直後にクエリを
    // 開始するようになったため、ここで誤ってクリアすると進行中のクエリの
    // 購読が壊れ「読み込み中」から進まなくなる（#163 の実際の不具合）。
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const clearSpy = vi.spyOn(queryClient, 'clear');

    renderGate({
      user: null,
      initialPath: '/public-page',
      publicPaths: ['/public-page'],
      queryClient,
    });

    expect(await screen.findByText('PUBLIC CONTENT')).toBeInTheDocument();
    // 少し待っても（非同期の復元処理が走っても）クリアされないことを確認する。
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(clearSpy).not.toHaveBeenCalled();
  });
});
