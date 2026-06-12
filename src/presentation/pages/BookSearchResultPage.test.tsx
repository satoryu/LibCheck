import { describe, expect, test } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { AvailabilityStatus } from '@/domain/models/availabilityStatus';
import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import type { SearchHistoryEntry } from '@/domain/models/searchHistoryEntry';
import type { LibraryRepository } from '@/domain/repositories/libraryRepository';
import type { RegisteredLibraryRepository } from '@/domain/repositories/registeredLibraryRepository';
import type { SearchHistoryRepository } from '@/domain/repositories/searchHistoryRepository';
import { renderRouteWithProviders, makeFakeDeps } from '@/test/testUtils';

class FakeLibraryRepository implements LibraryRepository {
  constructor(private readonly result: BookAvailability[] = []) {}

  async getLibraries(): Promise<Library[]> {
    return [];
  }

  async checkBookAvailability(): Promise<BookAvailability[]> {
    return this.result;
  }
}

class ErrorLibraryRepository implements LibraryRepository {
  async getLibraries(): Promise<Library[]> {
    return [];
  }
  async checkBookAvailability(): Promise<BookAvailability[]> {
    throw new Error('Network error');
  }
}

class FakeRegisteredLibraryRepository implements RegisteredLibraryRepository {
  constructor(private readonly libs: Library[] = []) {}

  async getAll(): Promise<Library[]> {
    return [...this.libs];
  }
  async saveAll(): Promise<void> {}
  async add(): Promise<Library[]> {
    return [...this.libs];
  }
  async addAll(): Promise<Library[]> {
    return [...this.libs];
  }
  async remove(): Promise<Library[]> {
    return [...this.libs];
  }
}

class FakeSearchHistoryRepository implements SearchHistoryRepository {
  savedEntries: SearchHistoryEntry[] = [];

  async getAll(): Promise<SearchHistoryEntry[]> {
    return [...this.savedEntries];
  }
  async save(entry: SearchHistoryEntry): Promise<void> {
    this.savedEntries = this.savedEntries.filter((e) => e.isbn !== entry.isbn);
    this.savedEntries.push(entry);
  }
  async remove(isbn: string): Promise<void> {
    this.savedEntries = this.savedEntries.filter((e) => e.isbn !== isbn);
  }
  async removeAll(): Promise<void> {
    this.savedEntries = [];
  }
}

const library1: Library = {
  systemId: 'Tokyo_Minato',
  systemName: '港区図書館',
  libKey: 'みなと',
  libId: '123',
  shortName: 'みなと図書館',
  formalName: '港区立みなと図書館',
  address: '東京都港区芝公園3-2-25',
  pref: '東京都',
  city: '港区',
  category: 'MEDIUM',
};

const library2: Library = {
  systemId: 'Tokyo_Shibuya',
  systemName: '渋谷区図書館',
  libKey: 'しぶや',
  libId: '456',
  shortName: '渋谷図書館',
  formalName: '渋谷区立中央図書館',
  address: '東京都渋谷区神宮前1-1-1',
  pref: '東京都',
  city: '渋谷区',
  category: 'LARGE',
};

interface SubjectOptions {
  libraryRepo: LibraryRepository;
  registeredRepo: RegisteredLibraryRepository;
  historyRepo?: SearchHistoryRepository;
  isbn?: string;
  source?: string;
}

function renderSubject(opts: SubjectOptions) {
  const isbn = opts.isbn ?? '9784123456789';
  const query = opts.source !== undefined ? `?source=${opts.source}` : '';
  return renderRouteWithProviders(`/result/${isbn}${query}`, {
    deps: makeFakeDeps({
      libraryRepository: opts.libraryRepo,
      registeredLibraryRepository: opts.registeredRepo,
      searchHistoryRepository:
        opts.historyRepo ?? new FakeSearchHistoryRepository(),
    }),
  });
}

describe('BookSearchResultPage', () => {
  test('displays ISBN', async () => {
    renderSubject({
      libraryRepo: new FakeLibraryRepository(),
      registeredRepo: new FakeRegisteredLibraryRepository(),
      isbn: '9784123456789',
    });

    expect(await screen.findByText(/9784123456789/)).toBeInTheDocument();
  });

  test('shows loading indicator while fetching', () => {
    renderSubject({
      libraryRepo: new FakeLibraryRepository(),
      registeredRepo: new FakeRegisteredLibraryRepository([library1]),
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('shows no library message when no libraries registered', async () => {
    renderSubject({
      libraryRepo: new FakeLibraryRepository(),
      registeredRepo: new FakeRegisteredLibraryRepository(),
    });

    expect(
      await screen.findByText(/図書館が登録されていません/),
    ).toBeInTheDocument();
  });

  test('shows availability cards for each library', async () => {
    const results: BookAvailability[] = [
      {
        isbn: '9784123456789',
        libraryStatuses: {
          Tokyo_Minato: {
            systemId: 'Tokyo_Minato',
            status: AvailabilityStatus.available,
            libKeyStatuses: { みなと: '貸出可' },
          },
          Tokyo_Shibuya: {
            systemId: 'Tokyo_Shibuya',
            status: AvailabilityStatus.checkedOut,
            libKeyStatuses: { しぶや: '貸出中' },
          },
        },
      },
    ];

    renderSubject({
      libraryRepo: new FakeLibraryRepository(results),
      registeredRepo: new FakeRegisteredLibraryRepository([library1, library2]),
    });

    expect(await screen.findByText('貸出可能')).toBeInTheDocument();
    expect(screen.getByText('貸出中')).toBeInTheDocument();
    expect(screen.getByText('港区立みなと図書館')).toBeInTheDocument();
    expect(screen.getByText('渋谷区立中央図書館')).toBeInTheDocument();
  });

  test('shows error message on failure', async () => {
    renderSubject({
      libraryRepo: new ErrorLibraryRepository(),
      registeredRepo: new FakeRegisteredLibraryRepository([library1]),
    });

    expect(await screen.findByText(/エラー/)).toBeInTheDocument();
  });

  test('shows scan button with camera icon when source is scan', async () => {
    const results: BookAvailability[] = [
      {
        isbn: '9784123456789',
        libraryStatuses: {
          Tokyo_Minato: {
            systemId: 'Tokyo_Minato',
            status: AvailabilityStatus.available,
            libKeyStatuses: { みなと: '貸出可' },
          },
        },
      },
    ];

    renderSubject({
      libraryRepo: new FakeLibraryRepository(results),
      registeredRepo: new FakeRegisteredLibraryRepository([library1]),
      source: 'scan',
    });

    expect(await screen.findByText('別の本をスキャンする')).toBeInTheDocument();
    expect(screen.getByTestId('CameraAltIcon')).toBeInTheDocument();
  });

  test('saves search history when results are loaded', async () => {
    const results: BookAvailability[] = [
      {
        isbn: '9784123456789',
        libraryStatuses: {
          Tokyo_Minato: {
            systemId: 'Tokyo_Minato',
            status: AvailabilityStatus.available,
            libKeyStatuses: { みなと: '貸出可' },
          },
        },
      },
    ];
    const historyRepo = new FakeSearchHistoryRepository();

    renderSubject({
      libraryRepo: new FakeLibraryRepository(results),
      registeredRepo: new FakeRegisteredLibraryRepository([library1]),
      historyRepo,
    });

    await waitFor(() => {
      expect(historyRepo.savedEntries).toHaveLength(1);
    });
    expect(historyRepo.savedEntries[0].isbn).toBe('9784123456789');
    expect(
      Object.values(historyRepo.savedEntries[0].libraryStatuses),
    ).toEqual(['available']);
  });

  test('saves the registered branch status, not the system-wide aggregate', async () => {
    // library1 は Tokyo_Minato の「みなと」分館のみ登録。同システムの別分館
    // 「三田」が貸出可でも、結果画面は登録分館「みなと」の貸出中を表示する。
    // 履歴も画面と一致するよう、システム集約(available)ではなく登録分館の
    // 状態(checkedOut)を保存しなければならない。
    const results: BookAvailability[] = [
      {
        isbn: '9784123456789',
        libraryStatuses: {
          Tokyo_Minato: {
            systemId: 'Tokyo_Minato',
            // システム集約は available（三田が貸出可のため）。
            status: AvailabilityStatus.available,
            libKeyStatuses: { みなと: '貸出中', 三田: '貸出可' },
          },
        },
      },
    ];
    const historyRepo = new FakeSearchHistoryRepository();

    renderSubject({
      libraryRepo: new FakeLibraryRepository(results),
      registeredRepo: new FakeRegisteredLibraryRepository([library1]),
      historyRepo,
    });

    await waitFor(() => {
      expect(historyRepo.savedEntries).toHaveLength(1);
    });
    expect(
      Object.values(historyRepo.savedEntries[0].libraryStatuses),
    ).toEqual(['checkedOut']);
  });

  test('does not save search history on error', async () => {
    const historyRepo = new FakeSearchHistoryRepository();

    renderSubject({
      libraryRepo: new ErrorLibraryRepository(),
      registeredRepo: new FakeRegisteredLibraryRepository([library1]),
      historyRepo,
    });

    expect(await screen.findByText(/エラー/)).toBeInTheDocument();
    expect(historyRepo.savedEntries).toHaveLength(0);
  });

  test('displays correct result when multiple BookAvailability results exist', async () => {
    const results: BookAvailability[] = [
      {
        isbn: '9784000000000',
        libraryStatuses: {
          Tokyo_Minato: {
            systemId: 'Tokyo_Minato',
            status: AvailabilityStatus.notFound,
            libKeyStatuses: { みなと: '蔵書なし' },
          },
        },
      },
      {
        isbn: '9784123456789',
        libraryStatuses: {
          Tokyo_Minato: {
            systemId: 'Tokyo_Minato',
            status: AvailabilityStatus.available,
            libKeyStatuses: { みなと: '貸出可' },
          },
        },
      },
    ];

    renderSubject({
      libraryRepo: new FakeLibraryRepository(results),
      registeredRepo: new FakeRegisteredLibraryRepository([library1]),
      isbn: '9784123456789',
    });

    // Should display the result for the searched ISBN, not results[0].
    expect(await screen.findByText('貸出可能')).toBeInTheDocument();
    expect(screen.queryByText('蔵書なし')).not.toBeInTheDocument();
  });
});
