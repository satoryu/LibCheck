import { describe, expect, test } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import { librariesEqual } from '@/domain/models/library';
import type { LibraryRepository } from '@/domain/repositories/libraryRepository';
import type { RegisteredLibraryRepository } from '@/domain/repositories/registeredLibraryRepository';
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

function renderPage(
  libraryRepo: LibraryRepository,
  registeredRepo: RegisteredLibraryRepository,
) {
  return renderRouteWithProviders(ROUTE, {
    deps: makeFakeDeps({
      libraryRepository: libraryRepo,
      registeredLibraryRepository: registeredRepo,
    }),
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
});
