import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider } from '@mui/material/styles';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { theme } from '@/theme';
import {
  DependenciesProvider,
  type AppDependencies,
} from '@/app/dependencies';
import { SelectedLibrariesProvider } from '@/presentation/hooks/useSelectedLibraries';
import { AuthProvider } from '@/presentation/auth/AuthProvider';
import { routes } from '@/app/router';
import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import type { LibraryRepository } from '@/domain/repositories/libraryRepository';
import type { RegisteredLibraryRepository } from '@/domain/repositories/registeredLibraryRepository';
import { makeFakeDeps } from '@/test/testUtils';

/**
 * Port of `test/presentation/router/app_router_test.dart`.
 *
 * Uses `createMemoryRouter(routes, ...)` + `RouterProvider` wrapped in the
 * `DependenciesProvider` so fake repositories can be injected (the React analog
 * of Riverpod `overrideWithValue`). Each test asserts the page rendered for a
 * given route and the empty-library redirect.
 */

const fakeLibrary: Library = {
  systemId: 'Tokyo_Pref',
  systemName: '東京都立図書館',
  libKey: 'Tokyo_Pref',
  libId: '1',
  shortName: '東京都立図書館',
  formalName: '東京都立中央図書館',
  address: '東京都港区南麻布9-26-1',
  pref: '東京都',
  city: '港区',
  category: '都道府県立',
};

class FakeRegisteredLibraryRepository implements RegisteredLibraryRepository {
  constructor(private readonly libraries: Library[] = []) {}
  async getAll(): Promise<Library[]> {
    return this.libraries;
  }
  async saveAll(): Promise<void> {}
  async add(): Promise<Library[]> {
    return this.libraries;
  }
  async addAll(): Promise<Library[]> {
    return this.libraries;
  }
  async remove(): Promise<Library[]> {
    return this.libraries;
  }
}

class FakeLibraryRepository implements LibraryRepository {
  async getLibraries(): Promise<Library[]> {
    return [];
  }
  async checkBookAvailability(): Promise<BookAvailability[]> {
    return [];
  }
}

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderRouterAt(
  route: string,
  deps: AppDependencies,
) {
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  const queryClient = makeQueryClient();
  const result = render(
    <DependenciesProvider value={deps}>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
          <ThemeProvider theme={theme}>
            <AuthProvider>
              <SelectedLibrariesProvider>
                <RouterProvider router={router} />
              </SelectedLibrariesProvider>
            </AuthProvider>
          </ThemeProvider>
        </SnackbarProvider>
      </QueryClientProvider>
    </DependenciesProvider>,
  );
  return { ...result, user: userEvent.setup() };
}

function depsWithRegistered(libraries: Library[]): AppDependencies {
  return makeFakeDeps({
    registeredLibraryRepository: new FakeRegisteredLibraryRepository(libraries),
    libraryRepository: new FakeLibraryRepository(),
  });
}

describe('AppRouter', () => {
  it('図書館登録済みの場合は/でホーム画面を表示する', async () => {
    renderRouterAt('/', depsWithRegistered([fakeLibrary]));

    await waitFor(() => {
      expect(screen.getByText('LibCheck')).toBeInTheDocument();
    });
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('図書館')).toBeInTheDocument();
    expect(screen.getByText('履歴')).toBeInTheDocument();
  });

  it('図書館未登録の場合は/にアクセスすると/libraryへリダイレクトされる', async () => {
    renderRouterAt('/', depsWithRegistered([]));

    await waitFor(() => {
      expect(screen.getByText('登録図書館')).toBeInTheDocument();
    });
    expect(screen.getByText('図書館が登録されていません')).toBeInTheDocument();
    expect(screen.getByText('図書館を登録する')).toBeInTheDocument();
    // BottomNavigation (Flutter NavigationBar) tabs remain visible.
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('履歴')).toBeInTheDocument();
  });

  it('tapping library tab navigates to library management page', async () => {
    const { user } = renderRouterAt('/', depsWithRegistered([fakeLibrary]));

    await waitFor(() => {
      expect(screen.getByText('LibCheck')).toBeInTheDocument();
    });

    await user.click(screen.getByText('図書館'));

    await waitFor(() => {
      expect(screen.getByText('登録図書館')).toBeInTheDocument();
    });
  });

  it('tapping history tab navigates to search history page', async () => {
    const { user } = renderRouterAt('/', depsWithRegistered([fakeLibrary]));

    await waitFor(() => {
      expect(screen.getByText('LibCheck')).toBeInTheDocument();
    });

    await user.click(screen.getByText('履歴'));

    await waitFor(() => {
      expect(screen.getByText('検索履歴')).toBeInTheDocument();
    });
  });

  it('navigates to prefecture selection page at /library/add', async () => {
    renderRouterAt('/library/add', depsWithRegistered([fakeLibrary]));

    await waitFor(() => {
      expect(screen.getByText('都道府県を選択')).toBeInTheDocument();
    });
  });

  it('navigates to search result page at /result/:isbn', async () => {
    renderRouterAt('/result/9784123456789', depsWithRegistered([fakeLibrary]));

    await screen.findByText('検索結果');
    // The ISBN line renders only after the registered-libraries query resolves,
    // so wait for it rather than asserting synchronously.
    expect(
      await screen.findByText((content) => content.includes('9784123456789')),
    ).toBeInTheDocument();
  });
});
