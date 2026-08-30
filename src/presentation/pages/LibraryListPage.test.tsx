import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider } from '@mui/material/styles';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import { librariesEqual } from '@/domain/models/library';
import type { LibraryRepository } from '@/domain/repositories/libraryRepository';
import type { RegisteredLibraryRepository } from '@/domain/repositories/registeredLibraryRepository';
import type { User } from '@/domain/models/user';
import { theme } from '@/theme';
import { DependenciesProvider } from '@/app/dependencies';
import { AuthProvider } from '@/presentation/auth/AuthProvider';
import { SelectedLibrariesProvider } from '@/presentation/hooks/useSelectedLibraries';
import { routes } from '@/app/router';
import { renderRouteWithProviders, makeFakeDeps } from '@/test/testUtils';

class MockLibraryRepository implements LibraryRepository {
  constructor(private readonly libs: Library[]) {}

  async getLibraries(args: { pref: string; city?: string }): Promise<Library[]> {
    return this.libs.filter(
      (lib) =>
        lib.pref === args.pref &&
        (args.city === undefined || lib.city === args.city),
    );
  }

  async checkBookAvailability(): Promise<BookAvailability[]> {
    return [];
  }
}

class ErrorLibraryRepository implements LibraryRepository {
  async getLibraries(): Promise<Library[]> {
    throw new Error('Network error');
  }
  async checkBookAvailability(): Promise<BookAvailability[]> {
    return [];
  }
}

class FakeRegisteredLibraryRepository implements RegisteredLibraryRepository {
  libs: Library[] = [];

  async getAll(): Promise<Library[]> {
    return [...this.libs];
  }
  async saveAll(libraries: Library[]): Promise<void> {
    this.libs = [...libraries];
  }
  async add(library: Library): Promise<Library[]> {
    if (!this.libs.some((e) => librariesEqual(e, library))) {
      this.libs.push(library);
    }
    return [...this.libs];
  }
  async addAll(libraries: Library[]): Promise<Library[]> {
    for (const lib of libraries) {
      if (!this.libs.some((e) => librariesEqual(e, lib))) {
        this.libs.push(lib);
      }
    }
    return [...this.libs];
  }
  async remove(library: Library): Promise<Library[]> {
    this.libs = this.libs.filter((e) => !librariesEqual(e, library));
    return [...this.libs];
  }
}

function createLibrary(opts: {
  formalName: string;
  address: string;
  pref?: string;
  city?: string;
  libId?: string;
}): Library {
  return {
    systemId: 'system1',
    systemName: 'テスト図書館システム',
    libKey: 'key1',
    libId: opts.libId ?? 'id1',
    shortName: opts.formalName,
    formalName: opts.formalName,
    address: opts.address,
    pref: opts.pref ?? '東京都',
    city: opts.city ?? '港区',
    category: 'MEDIUM',
  };
}

const ROUTE = '/library/add/東京都/港区';

// #158: この画面は未ログインでも閲覧できる（公開ルート）が、登録操作は
// 引き続きログインが必要。既存のテストは「ログイン済みユーザーとして
// 登録できること」を検証する意図のため、既定をログイン済みにする。
// 未ログイン時の挙動は専用の describe ブロックで別途検証する。
const LOGGED_IN_USER: User = { id: 'test-user', name: 'Test User' };

function renderPage(
  libraryRepo: LibraryRepository,
  registeredRepo: RegisteredLibraryRepository,
  authUser: User | null = LOGGED_IN_USER,
) {
  return renderRouteWithProviders(ROUTE, {
    deps: makeFakeDeps({
      libraryRepository: libraryRepo,
      registeredLibraryRepository: registeredRepo,
    }),
    authUser,
  });
}

describe('LibraryListPage', () => {
  test('renders AppBar with city name', () => {
    renderPage(
      new MockLibraryRepository([]),
      new FakeRegisteredLibraryRepository(),
    );

    expect(screen.getByText('港区の図書館')).toBeInTheDocument();
  });

  test('displays library list after loading', async () => {
    const libraries = [
      createLibrary({
        formalName: '東京都立中央図書館',
        address: '東京都港区南麻布5-7-13',
        libId: '1',
      }),
      createLibrary({
        formalName: '港区立みなと図書館',
        address: '東京都港区芝浦3-16-25',
        libId: '2',
      }),
    ];

    renderPage(
      new MockLibraryRepository(libraries),
      new FakeRegisteredLibraryRepository(),
    );

    expect(await screen.findByText('東京都立中央図書館')).toBeInTheDocument();
    expect(screen.getByText('港区立みなと図書館')).toBeInTheDocument();
  });

  test('can toggle library selection', async () => {
    const libraries = [createLibrary({ formalName: '図書館1', address: '住所1' })];

    const { user } = renderPage(
      new MockLibraryRepository(libraries),
      new FakeRegisteredLibraryRepository(),
    );

    await user.click(await screen.findByText('図書館1'));

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  test('shows selected count in button', async () => {
    const libraries = [
      createLibrary({ formalName: '図書館1', address: '住所1', libId: '1' }),
      createLibrary({ formalName: '図書館2', address: '住所2', libId: '2' }),
    ];

    const { user } = renderPage(
      new MockLibraryRepository(libraries),
      new FakeRegisteredLibraryRepository(),
    );

    await user.click(await screen.findByText('図書館1'));

    expect(screen.getByText(/1件選択中/)).toBeInTheDocument();
  });

  test('register button saves selected libraries', async () => {
    const libraries = [
      createLibrary({ formalName: '図書館1', address: '住所1', libId: '1' }),
      createLibrary({ formalName: '図書館2', address: '住所2', libId: '2' }),
    ];
    const registeredRepo = new FakeRegisteredLibraryRepository();

    const { user } = renderPage(
      new MockLibraryRepository(libraries),
      registeredRepo,
    );

    await user.click(await screen.findByText('図書館1'));
    await user.click(
      screen.getByRole('button', { name: /選択した図書館を登録する/ }),
    );

    await waitFor(() => {
      expect(registeredRepo.libs).toHaveLength(1);
    });
    expect(registeredRepo.libs[0].formalName).toBe('図書館1');
  });

  test('navigates to the library management page after registration', async () => {
    // 登録完了後は登録図書館の管理画面へ遷移し、登録結果を確認できるようにする。
    const libraries = [
      createLibrary({ formalName: '図書館1', address: '住所1', libId: '1' }),
    ];

    const { user } = renderPage(
      new MockLibraryRepository(libraries),
      new FakeRegisteredLibraryRepository(),
    );

    await user.click(await screen.findByText('図書館1'));
    await user.click(
      screen.getByRole('button', { name: /選択した図書館を登録する/ }),
    );

    // 管理画面の AppBar タイトル「登録図書館」と登録した図書館が表示される。
    expect(await screen.findByText('登録図書館')).toBeInTheDocument();
    expect(await screen.findByText('図書館1')).toBeInTheDocument();
  });

  test('shows ErrorStateWidget on failure', async () => {
    renderPage(
      new ErrorLibraryRepository(),
      new FakeRegisteredLibraryRepository(),
    );

    expect(await screen.findByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('再試行')).toBeInTheDocument();
  });

  test('shows loading text with indicator', () => {
    renderPage(
      new MockLibraryRepository([]),
      new FakeRegisteredLibraryRepository(),
    );

    // Loading state is rendered synchronously before the query resolves.
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('図書館を検索中...')).toBeInTheDocument();
  });

  test('does not carry the selection over to another city', async () => {
    // 港区で選択 → 登録せずに渋谷区の一覧へ遷移すると、前の選択が残ったまま
    // 別の街の図書館を誤登録してしまう不具合の回帰テスト。
    const libraries = [
      createLibrary({
        formalName: '港区図書館',
        address: '港区の住所',
        libId: 'a',
        city: '港区',
      }),
      createLibrary({
        formalName: '渋谷区図書館',
        address: '渋谷区の住所',
        libId: 'b',
        city: '渋谷区',
      }),
    ];
    const router = createMemoryRouter(routes, {
      initialEntries: ['/library/add/東京都/港区'],
    });
    const deps = makeFakeDeps({
      libraryRepository: new MockLibraryRepository(libraries),
      registeredLibraryRepository: new FakeRegisteredLibraryRepository(),
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <DependenciesProvider value={deps}>
        <QueryClientProvider client={queryClient}>
          <SnackbarProvider>
            <ThemeProvider theme={theme}>
              <AuthProvider initialUser={{ id: 'test-user', name: 'Test User' }}>
                <SelectedLibrariesProvider>
                  <RouterProvider router={router} />
                </SelectedLibrariesProvider>
              </AuthProvider>
            </ThemeProvider>
          </SnackbarProvider>
        </QueryClientProvider>
      </DependenciesProvider>,
    );
    const user = userEvent.setup();

    // 港区で1件選択する。
    await user.click(await screen.findByText('港区図書館'));
    expect(screen.getByText(/1件選択中/)).toBeInTheDocument();

    // 登録せずに別の市区町村の一覧へ遷移する（同一ルートのパラメータ変更）。
    await act(async () => {
      await router.navigate('/library/add/東京都/渋谷区');
    });

    // 前の選択は持ち越されておらず、登録ボタンは無効のまま。
    expect(await screen.findByText('渋谷区図書館')).toBeInTheDocument();
    expect(screen.queryByText(/選択中/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /選択した図書館を登録する/ }),
    ).toBeDisabled();
  });
});

describe('図書館一覧のカーリルへのリンク（#156）', () => {
  // カーリル図書館APIの仕様上、APIで取得した図書館名を表示する場合は
  // カーリルへのリンクが必須。この画面は行全体が選択用の ListItemButton で
  // あり内側に <a> を置けないため、一覧単位の帰属表示でリンクを担保する。
  // https://calil.jp/doc/api_ref.html
  test('一覧が表示されているときカーリルへのリンクを表示する', async () => {
    renderPage(
      new MockLibraryRepository([
        createLibrary({
          formalName: '東京都立中央図書館',
          address: '東京都港区南麻布5-7-13',
        }),
      ]),
      new FakeRegisteredLibraryRepository(),
    );

    await screen.findByText('東京都立中央図書館');
    const link = screen.getByRole('link', { name: /カーリル/ });
    expect(link).toHaveAttribute('href', 'https://calil.jp/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel') ?? '').toContain('noopener');
  });

  test('図書館が0件のときは図書館名を表示しないため帰属表示も出さない', async () => {
    renderPage(
      new MockLibraryRepository([]),
      new FakeRegisteredLibraryRepository(),
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /選択した図書館を登録する/ }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole('link', { name: /カーリル/ })).not.toBeInTheDocument();
  });
});

describe('未ログインでの登録操作（#158, #167）', () => {
  // この画面自体は #158 で未ログインでも閲覧できるようになったが、登録
  // 操作はサーバ側が引き続き認証必須（#89）。#167 以前は navigate('/') で
  // 選択状態を破棄してランディングへ丸ごと遷移していたが、選択のやり直しを
  // 強いる離脱要因になっていたため、選択を保持したままその場でログインし
  // 登録を続行する形に変更した。
  beforeEach(() => {
    vi.stubEnv('VITE_AUTH_MOCK', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('未ログインで登録すると、選択を保持したままログインダイアログが開く', async () => {
    const libraries = [
      createLibrary({ formalName: '図書館1', address: '住所1', libId: '1' }),
    ];
    const registeredRepo = new FakeRegisteredLibraryRepository();

    const { user } = renderPage(
      new MockLibraryRepository(libraries),
      registeredRepo,
      null,
    );

    await user.click(await screen.findByText('図書館1'));
    await user.click(
      screen.getByRole('button', { name: /選択した図書館を登録する/ }),
    );

    // 画面遷移はせず、ダイアログの中に選択中の図書館名が表示される。
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('図書館1');
    // 一覧側の選択も破棄されていない。
    expect(screen.getByText(/1件選択中/)).toBeInTheDocument();
    // ログインするまで登録APIは呼ばれていない。
    expect(registeredRepo.libs).toHaveLength(0);
  });

  test('ダイアログでログインすると、選択した図書館が自動で登録され管理画面へ遷移する', async () => {
    const libraries = [
      createLibrary({ formalName: '図書館1', address: '住所1', libId: '1' }),
    ];
    const registeredRepo = new FakeRegisteredLibraryRepository();

    const { user } = renderPage(
      new MockLibraryRepository(libraries),
      registeredRepo,
      null,
    );

    await user.click(await screen.findByText('図書館1'));
    await user.click(
      screen.getByRole('button', { name: /選択した図書館を登録する/ }),
    );
    await screen.findByRole('dialog');

    await user.click(
      screen.getByRole('button', { name: 'Dev ログイン（モック）' }),
    );

    // 選び直す操作なしに、選択していた図書館がそのまま登録される。
    await waitFor(() => {
      expect(registeredRepo.libs).toHaveLength(1);
    });
    expect(registeredRepo.libs[0].formalName).toBe('図書館1');
    expect(await screen.findByText('登録図書館')).toBeInTheDocument();
  });

  test('ダイアログをキャンセルすると選択は残るが登録はされない', async () => {
    const libraries = [
      createLibrary({ formalName: '図書館1', address: '住所1', libId: '1' }),
    ];
    const registeredRepo = new FakeRegisteredLibraryRepository();

    const { user } = renderPage(
      new MockLibraryRepository(libraries),
      registeredRepo,
      null,
    );

    await user.click(await screen.findByText('図書館1'));
    await user.click(
      screen.getByRole('button', { name: /選択した図書館を登録する/ }),
    );
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    // MUI Dialog は Close 後も退場トランジションの間 DOM に残るため待つ。
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByText(/1件選択中/)).toBeInTheDocument();
    expect(registeredRepo.libs).toHaveLength(0);
  });
});
