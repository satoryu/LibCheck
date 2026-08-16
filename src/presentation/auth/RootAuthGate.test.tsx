import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { theme } from '@/theme';
import { DependenciesProvider } from '@/app/dependencies';
import { makeFakeDeps } from '@/test/testUtils';
import { AuthProvider } from '@/presentation/auth/AuthProvider';
import { RootAuthGate } from '@/presentation/auth/RootAuthGate';
import type { User } from '@/domain/models/user';

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

  it('ログアウト（user が null に変化）すると React Query キャッシュをクリアする', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const clearSpy = vi.spyOn(queryClient, 'clear');

    renderGate({ user: null, initialPath: '/', queryClient });

    await waitFor(() => {
      expect(clearSpy).toHaveBeenCalledTimes(1);
    });
  });
});
