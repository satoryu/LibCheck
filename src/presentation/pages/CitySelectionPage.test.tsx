import { describe, it, expect, afterEach } from 'vitest';
import { screen, within } from '@testing-library/react';

import { makeFakeDeps, renderRouteWithProviders } from '@/test/testUtils';
import { regionPath } from '@/presentation/regionPage/regionPageContent';
import type { AppDependencies } from '@/app/dependencies';
import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import type { LibraryRepository } from '@/domain/repositories/libraryRepository';

/**
 * Port of `test/presentation/pages/city_selection_page_test.dart`.
 *
 * The Flutter test overrode `libraryRepositoryProvider`; here the fake
 * `LibraryRepository` is injected through `makeFakeDeps`, and `:pref` is
 * supplied via the route (`/library/add/東京都`).
 */

function createLibrary({
  pref,
  city,
  libId = 'id1',
}: {
  pref: string;
  city: string;
  libId?: string;
}): Library {
  return {
    systemId: 'system1',
    systemName: 'テスト図書館システム',
    libKey: 'key1',
    libId,
    shortName: 'テスト図書館',
    formalName: 'テスト図書館',
    address: `${pref}${city}`,
    pref,
    city,
    category: 'MEDIUM',
  };
}

function mockLibraryRepository(libraries: Library[]): LibraryRepository {
  return {
    getLibraries: async ({ pref }) => libraries.filter((lib) => lib.pref === pref),
    checkBookAvailability: async (): Promise<BookAvailability[]> => [],
  };
}

function errorLibraryRepository(): LibraryRepository {
  return {
    getLibraries: async () => {
      throw new Error('Network error');
    },
    checkBookAvailability: async (): Promise<BookAvailability[]> => [],
  };
}

function depsWith(repository: LibraryRepository): AppDependencies {
  return makeFakeDeps({ libraryRepository: repository });
}

describe('CitySelectionPage', () => {
  afterEach(() => {
    // テストで模擬した履歴インデックスをリセットする。
    window.history.replaceState(null, '');
  });

  it('renders AppBar with prefecture name', async () => {
    renderRouteWithProviders('/library/add/東京都', {
      deps: depsWith(mockLibraryRepository([])),
    });

    expect(await screen.findByText('東京都の市区町村')).toBeInTheDocument();
  });

  it('displays city list after loading', async () => {
    const libraries = [
      createLibrary({ pref: '東京都', city: '港区', libId: '1' }),
      createLibrary({ pref: '東京都', city: '新宿区', libId: '2' }),
      createLibrary({ pref: '東京都', city: '千代田区', libId: '3' }),
    ];

    renderRouteWithProviders('/library/add/東京都', {
      deps: depsWith(mockLibraryRepository(libraries)),
    });

    expect(await screen.findByText('千代田区')).toBeInTheDocument();
    expect(screen.getByText('新宿区')).toBeInTheDocument();
    expect(screen.getByText('港区')).toBeInTheDocument();
  });

  it('filters cities by search text', async () => {
    const libraries = [
      createLibrary({ pref: '東京都', city: '港区', libId: '1' }),
      createLibrary({ pref: '東京都', city: '新宿区', libId: '2' }),
      createLibrary({ pref: '東京都', city: '千代田区', libId: '3' }),
    ];

    const { user } = renderRouteWithProviders('/library/add/東京都', {
      deps: depsWith(mockLibraryRepository(libraries)),
    });

    await screen.findByText('港区');

    await user.type(screen.getByPlaceholderText('市区町村を検索...'), '港');

    expect(screen.getByText('港区')).toBeInTheDocument();
    expect(screen.queryByText('新宿区')).not.toBeInTheDocument();
    expect(screen.queryByText('千代田区')).not.toBeInTheDocument();
  });

  it('戻るボタンで都道府県選択画面へ戻る', async () => {
    const { user } = renderRouteWithProviders('/library/add', {
      deps: depsWith(mockLibraryRepository([])),
    });

    await user.click(await screen.findByText('東京都'));
    expect(await screen.findByText('東京都の市区町村')).toBeInTheDocument();

    // createMemoryRouter は window.history を更新しないため、
    // 遷移済みの履歴インデックスを模擬する。
    window.history.replaceState({ idx: 1 }, '');
    await user.click(screen.getByRole('button', { name: '戻る' }));

    expect(await screen.findByText('都道府県を選択')).toBeInTheDocument();
  });

  it('shows ErrorStateWidget on failure', async () => {
    renderRouteWithProviders('/library/add/東京都', {
      deps: depsWith(errorLibraryRepository()),
    });

    expect(await screen.findByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('再試行')).toBeInTheDocument();
  });

  it('未ログイン時はLibCheckの案内を表示する（#167）', async () => {
    renderRouteWithProviders('/library/add/東京都', {
      deps: depsWith(mockLibraryRepository([])),
    });

    expect(await screen.findByLabelText('LibCheckについて')).toBeInTheDocument();
  });

  it('ログイン中は案内を表示しない（#167）', async () => {
    renderRouteWithProviders('/library/add/東京都', {
      deps: depsWith(mockLibraryRepository([])),
      authUser: { id: 'test-user', name: 'Test User' },
    });

    await screen.findByText('東京都の市区町村');
    expect(screen.queryByLabelText('LibCheckについて')).not.toBeInTheDocument();
  });

  describe('見出し・パンくず・内部リンク（#182）', () => {
    const libraries = [
      createLibrary({ pref: '東京都', city: '港区', libId: '1' }),
      createLibrary({ pref: '東京都', city: '港区', libId: '2' }),
      createLibrary({ pref: '東京都', city: '新宿区', libId: '3' }),
    ];

    it('h1 に市区町村数・館数を表示する', async () => {
      renderRouteWithProviders('/library/add/東京都', {
        deps: depsWith(mockLibraryRepository(libraries)),
      });

      expect(
        await screen.findByRole('heading', { level: 1, name: '東京都の図書館（2市区町村・3館）' }),
      ).toBeInTheDocument();
    });

    it('市区町村は館数付きの <a href> で、市区町村ページへ移動できる', async () => {
      const { user } = renderRouteWithProviders('/library/add/東京都', {
        deps: depsWith(mockLibraryRepository(libraries)),
      });

      const link = await screen.findByRole('link', { name: /港区/ });
      expect(link).toHaveAttribute('href', regionPath('東京都', '港区'));
      expect(link).toHaveTextContent('2館');

      await user.click(link);
      expect(await screen.findByText('港区の図書館')).toBeInTheDocument();
    });

    it('パンくずから都道府県一覧へリンクする', async () => {
      renderRouteWithProviders('/library/add/東京都', {
        deps: depsWith(mockLibraryRepository(libraries)),
      });

      const nav = screen.getByRole('navigation', { name: 'パンくずリスト' });
      expect(within(nav).getByRole('link', { name: '都道府県から探す' })).toHaveAttribute(
        'href',
        regionPath(),
      );
      expect(within(nav).getByText('東京都')).toHaveAttribute('aria-current', 'page');
    });
  });
});
