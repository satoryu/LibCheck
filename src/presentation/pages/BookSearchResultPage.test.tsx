import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';

import { AvailabilityStatus } from '@/domain/models/availabilityStatus';
import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import type { SearchHistoryEntry } from '@/domain/models/searchHistoryEntry';
import type { LibraryRepository } from '@/domain/repositories/libraryRepository';
import type { RegisteredLibraryRepository } from '@/domain/repositories/registeredLibraryRepository';
import type { SearchHistoryRepository } from '@/domain/repositories/searchHistoryRepository';
import type { BookMetadataRepository } from '@/domain/repositories/bookMetadataRepository';
import type { BookMetadata } from '@/domain/models/bookMetadata';
import {
  renderRouteWithProviders,
  makeFakeDeps,
  FakeBookMetadataRepository,
} from '@/test/testUtils';
import { trackBookPreviewView, trackBookSearchResultView } from '@/analytics/events';
import type { SessionApi } from '@/data/datasources/sessionApiClient';
import type { User } from '@/domain/models/user';

// GA4 計測（#169）。イベント名ではなく「意味のある呼び出し」で検証する。
vi.mock('@/analytics/events', () => ({
  trackIsbnScanSuccess: vi.fn(),
  trackBookSearchResultView: vi.fn(),
  trackBookPreviewView: vi.fn(),
  trackLibraryReservationLinkClick: vi.fn(),
  trackAmazonAffiliateLinkClick: vi.fn(),
}));

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
  async save(entry: SearchHistoryEntry): Promise<SearchHistoryEntry[]> {
    this.savedEntries = this.savedEntries.filter((e) => e.isbn !== entry.isbn);
    this.savedEntries.push(entry);
    return [...this.savedEntries];
  }
  async remove(isbn: string): Promise<SearchHistoryEntry[]> {
    this.savedEntries = this.savedEntries.filter((e) => e.isbn !== isbn);
    return [...this.savedEntries];
  }
  async removeAll(): Promise<SearchHistoryEntry[]> {
    this.savedEntries = [];
    return [];
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

class ThrowingBookMetadataRepository implements BookMetadataRepository {
  async getByIsbn(): Promise<BookMetadata | null> {
    throw new Error('OpenBD network error');
  }
  async getByIsbns(): Promise<Map<string, BookMetadata>> {
    throw new Error('OpenBD network error');
  }
}

/** 既存のテストはログイン済みの結果表示を検証する（未ログインの表示は #159 の describe で検証）。 */
const LOGGED_IN_USER: User = { id: 'test-user', name: 'Test User' };

interface SubjectOptions {
  authUser?: User | null;
  sessionApi?: SessionApi;
  libraryRepo: LibraryRepository;
  registeredRepo: RegisteredLibraryRepository;
  historyRepo?: SearchHistoryRepository;
  metadataRepo?: BookMetadataRepository;
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
      bookMetadataRepository:
        opts.metadataRepo ?? new FakeBookMetadataRepository(),
    }),
    authUser: opts.authUser === undefined ? LOGGED_IN_USER : opts.authUser,
    sessionApi: opts.sessionApi,
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

  test('オフライン時はオフライン専用メッセージを表示する（#145）', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    try {
      renderSubject({
        libraryRepo: new ErrorLibraryRepository(),
        registeredRepo: new FakeRegisteredLibraryRepository([library1]),
      });

      expect(
        await screen.findByText('オフラインです。接続を確認してください'),
      ).toBeInTheDocument();
    } finally {
      Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        value: true,
      });
    }
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

  test('source=scan のとき「別の本をスキャンする」でスキャン画面へ遷移する', async () => {
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

    const { user } = renderSubject({
      libraryRepo: new FakeLibraryRepository(results),
      registeredRepo: new FakeRegisteredLibraryRepository([library1]),
      source: 'scan',
    });

    await user.click(await screen.findByText('別の本をスキャンする'));

    // jsdom にはカメラが無いためスキャン画面はエラーフォールバックを表示するが、
    // AppBar タイトル「バーコードスキャン」で遷移先を判定できる。
    expect(await screen.findByText('バーコードスキャン')).toBeInTheDocument();
  });

  test('直アクセス（履歴なし・source なし）でも「別の本を検索する」でISBN入力画面へ遷移する', async () => {
    // renderRouteWithProviders は /result/:isbn を初期ルートにするため、
    // 遷移履歴の無いURL直アクセスを再現できる（navigate(-1) では行き止まりになるケース）。
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

    const { user } = renderSubject({
      libraryRepo: new FakeLibraryRepository(results),
      registeredRepo: new FakeRegisteredLibraryRepository([library1]),
    });

    await user.click(await screen.findByText('別の本を検索する'));

    expect(await screen.findByText('ISBN入力')).toBeInTheDocument();
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

  test('貸出可能の図書館が蔵書なしより上に表示される（在庫状況順ソート）', async () => {
    // 登録順は library1(港区=蔵書なし) → library2(渋谷=貸出可) だが、
    // 結果画面では貸出可の渋谷が上位に来る。
    const results: BookAvailability[] = [
      {
        isbn: '9784123456789',
        libraryStatuses: {
          Tokyo_Minato: {
            systemId: 'Tokyo_Minato',
            status: AvailabilityStatus.notFound,
            libKeyStatuses: { みなと: '蔵書なし' },
          },
          Tokyo_Shibuya: {
            systemId: 'Tokyo_Shibuya',
            status: AvailabilityStatus.available,
            libKeyStatuses: { しぶや: '貸出可' },
          },
        },
      },
    ];

    renderSubject({
      libraryRepo: new FakeLibraryRepository(results),
      registeredRepo: new FakeRegisteredLibraryRepository([library1, library2]),
      isbn: '9784123456789',
    });

    const shibuya = await screen.findByText('渋谷区立中央図書館');
    const minato = await screen.findByText('港区立みなと図書館');

    // 渋谷（貸出可）が港区（蔵書なし）より DOM 上で前に出る。
    expect(
      shibuya.compareDocumentPosition(minato) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  test('書籍メタデータ（タイトル・書影・Amazonリンク）を表示する', async () => {
    const results: BookAvailability[] = [
      {
        isbn: '9784873117584',
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
      metadataRepo: new FakeBookMetadataRepository({
        '9784873117584': {
          isbn: '9784873117584',
          title: 'リーダブルコード',
        },
      }),
      isbn: '9784873117584',
    });

    expect(await screen.findByText('リーダブルコード')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Amazonで見る/ });
    expect(link).toHaveAttribute(
      'href',
      'https://www.amazon.co.jp/dp/4873117585',
    );
    expect(screen.getByTestId('book-cover')).toBeInTheDocument();
  });

  test('メタデータ取得が失敗しても蔵書状況は表示される', async () => {
    const results: BookAvailability[] = [
      {
        isbn: '9784873117584',
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
      metadataRepo: new ThrowingBookMetadataRepository(),
      isbn: '9784873117584',
    });

    // メタデータ失敗時もカード自体（Amazonリンク）と蔵書状況は表示される。
    expect(await screen.findByText('貸出可能')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Amazonで見る/ }),
    ).toBeInTheDocument();
  });
});

describe('BookSearchResultPage GA4 計測（#169）', () => {
  const trackView = vi.mocked(trackBookSearchResultView);

  /** タイトル取得（OpenBD）の解決タイミングを制御して再レンダリングを起こす。 */
  class DeferredBookMetadataRepository implements BookMetadataRepository {
    private resolveFn: ((value: BookMetadata | null) => void) | null = null;

    async getByIsbn(): Promise<BookMetadata | null> {
      return new Promise((resolve) => {
        this.resolveFn = resolve;
      });
    }
    async getByIsbns(): Promise<Map<string, BookMetadata>> {
      return new Map();
    }
    release(metadata: BookMetadata | null): void {
      this.resolveFn?.(metadata);
    }
  }

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

  beforeEach(() => {
    // 他の describe のテストも結果画面を描画するため、各テストの直前に消す。
    trackView.mockClear();
  });

  test('蔵書状況を確認できる状態になったら件数付きで計測する', async () => {
    renderSubject({
      libraryRepo: new FakeLibraryRepository(results),
      registeredRepo: new FakeRegisteredLibraryRepository([library1, library2]),
    });

    await screen.findByText('貸出可能');

    expect(trackView).toHaveBeenCalledTimes(1);
    expect(trackView).toHaveBeenCalledWith({
      searchedLibraryCount: 2,
      holdingLibraryCount: 2,
      availableLibraryCount: 1,
    });
  });

  test('タイトル取得の遅延で再レンダリングされても再送しない', async () => {
    const metadataRepo = new DeferredBookMetadataRepository();
    renderSubject({
      libraryRepo: new FakeLibraryRepository(results),
      registeredRepo: new FakeRegisteredLibraryRepository([library1, library2]),
      metadataRepo,
    });

    await screen.findByText('貸出可能');
    expect(trackView).toHaveBeenCalledTimes(1);

    // 蔵書状況の表示後にタイトルが届き、同じ画面が再描画される。
    metadataRepo.release({
      isbn: '9784123456789',
      title: '吾輩は猫である',
      coverImageUrl: undefined,
    });

    expect(await screen.findByText('吾輩は猫である')).toBeInTheDocument();
    expect(trackView).toHaveBeenCalledTimes(1);
  });

  test('読み込み中・エラー時は計測しない', async () => {
    renderSubject({
      libraryRepo: new ErrorLibraryRepository(),
      registeredRepo: new FakeRegisteredLibraryRepository([library1]),
    });

    await screen.findByText(/エラー/);

    expect(trackView).not.toHaveBeenCalled();
  });

  test('図書館が未登録のときは計測しない（蔵書状況を確認できていないため）', async () => {
    renderSubject({
      libraryRepo: new FakeLibraryRepository(),
      registeredRepo: new FakeRegisteredLibraryRepository(),
    });

    await screen.findByText(/図書館が登録されていません/);

    expect(trackView).not.toHaveBeenCalled();
  });
});

describe('未ログインでの表示（#159）', () => {
  const metadata = new FakeBookMetadataRepository({
    '9784123456789': { isbn: '9784123456789', title: 'テストの本' },
  });

  /** 復元を手で完了させられるセッション。 */
  function controlledSession() {
    let resolve: (user: User | null) => void = () => {};
    const session: SessionApi = {
      restore: () => new Promise((r) => (resolve = r)),
      create: async () => {},
      destroy: async () => {},
    };
    return { session, finish: (user: User | null) => act(async () => resolve(user)) };
  }

  function spies() {
    const libraryRepo = new FakeLibraryRepository([
      {
        isbn: '9784123456789',
        libraryStatuses: {
          Tokyo_Minato: { systemId: 'Tokyo_Minato', status: AvailabilityStatus.available, libKeyStatuses: { みなと: '貸出可' } },
        },
      },
    ]);
    const registeredRepo = new FakeRegisteredLibraryRepository([library1]);
    return {
      libraryRepo,
      registeredRepo,
      check: vi.spyOn(libraryRepo, 'checkBookAvailability'),
      getAll: vi.spyOn(registeredRepo, 'getAll'),
    };
  }

  beforeEach(() => {
    vi.mocked(trackBookPreviewView).mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('書誌情報と案内を表示し、ログインが必要な API は呼ばない', async () => {
    const { session, finish } = controlledSession();
    const s = spies();
    renderSubject({ ...s, metadataRepo: metadata, authUser: null, sessionApi: session });
    await finish(null);

    expect(await screen.findByText('テストの本')).toBeInTheDocument();
    expect(screen.getByText(/9784123456789/)).toBeInTheDocument();
    expect(screen.getByText(/ログインして図書館を登録すると/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /近くの図書館を探す/ })).toHaveAttribute('href', '/library/add');
    expect(screen.queryByText('蔵書状況')).not.toBeInTheDocument();
    expect(s.check).not.toHaveBeenCalled();
    expect(s.getAll).not.toHaveBeenCalled();
  });

  test('未ログインの表示を1回だけ計測し、検索結果の表示としては計測しない', async () => {
    const { session, finish } = controlledSession();
    vi.mocked(trackBookSearchResultView).mockClear();
    renderSubject({ ...spies(), metadataRepo: metadata, authUser: null, sessionApi: session });
    await finish(null);

    await screen.findByText(/ログインして図書館を登録すると/);
    expect(trackBookPreviewView).toHaveBeenCalledTimes(1);
    expect(trackBookSearchResultView).not.toHaveBeenCalled();
  });

  test('セッション復元中は読み込み中を表示し、未ログイン用の案内は出さない', async () => {
    const { session, finish } = controlledSession();
    const s = spies();
    renderSubject({ ...s, metadataRepo: metadata, authUser: null, sessionApi: session });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText(/ログインして図書館を登録すると/)).not.toBeInTheDocument();

    // 復元できた（ログイン済みだった）場合は、案内を出さずに蔵書状況へ。
    await finish(LOGGED_IN_USER);
    expect(await screen.findByText('貸出可能')).toBeInTheDocument();
    expect(screen.queryByText(/ログインして図書館を登録すると/)).not.toBeInTheDocument();
    expect(trackBookPreviewView).not.toHaveBeenCalled();
  });

  test('その場でログインすると、同じページで蔵書状況に切り替わる', async () => {
    vi.stubEnv('VITE_AUTH_MOCK', 'true');
    const { session, finish } = controlledSession();
    const s = spies();
    const { user } = renderSubject({ ...s, metadataRepo: metadata, authUser: null, sessionApi: session });
    await finish(null);

    await user.click(await screen.findByRole('button', { name: 'Dev ログイン（モック）' }));

    expect(await screen.findByText('貸出可能')).toBeInTheDocument();
    expect(screen.getByText('港区立みなと図書館')).toBeInTheDocument();
    expect(s.check).toHaveBeenCalled();
  });
});
