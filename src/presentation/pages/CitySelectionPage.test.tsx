import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';

import { makeFakeDeps, renderRouteWithProviders } from '@/test/testUtils';
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

  it('shows ErrorStateWidget on failure', async () => {
    renderRouteWithProviders('/library/add/東京都', {
      deps: depsWith(errorLibraryRepository()),
    });

    expect(await screen.findByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('再試行')).toBeInTheDocument();
  });
});
