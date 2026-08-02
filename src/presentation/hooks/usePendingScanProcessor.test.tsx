import React from "react";
import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";
import { DependenciesProvider } from "@/app/dependencies";
import type { AppDependencies } from "@/app/dependencies";
import { makeFakeDeps } from "@/test/testUtils";
import { usePendingScanProcessor } from "@/presentation/hooks/usePendingScanProcessor";
import type { BookAvailability } from "@/domain/models/bookAvailability";
import { AvailabilityStatus } from "@/domain/models/availabilityStatus";
import type { Library } from "@/domain/models/library";
import { libraryKey } from "@/domain/models/library";
import type { LibraryRepository } from "@/domain/repositories/libraryRepository";
import type { RegisteredLibraryRepository } from "@/domain/repositories/registeredLibraryRepository";
import type { SearchHistoryEntry } from "@/domain/models/searchHistoryEntry";

function createLibrary(args: { systemId: string; libKey: string }): Library {
  return {
    systemId: args.systemId,
    systemName: "テストシステム",
    libKey: args.libKey,
    libId: `${args.systemId}-${args.libKey}`,
    shortName: args.libKey,
    formalName: `${args.libKey}図書館`,
    address: "東京都千代田区",
    pref: "東京都",
    city: "千代田区",
    category: "MEDIUM",
  };
}

class FakeRegisteredLibraryRepository implements RegisteredLibraryRepository {
  constructor(private libraries: Library[]) {}
  async getAll(): Promise<Library[]> {
    return [...this.libraries];
  }
  async saveAll(): Promise<void> {}
  async add(): Promise<Library[]> {
    return [...this.libraries];
  }
  async addAll(): Promise<Library[]> {
    return [...this.libraries];
  }
  async remove(): Promise<Library[]> {
    return [...this.libraries];
  }
}

class FakeLibraryRepository implements LibraryRepository {
  checkCalls: Array<{ isbn: string[]; systemIds: string[] }> = [];
  failWith: Error | null = null;

  constructor(private resultsByIsbn: Record<string, BookAvailability>) {}

  async getLibraries(): Promise<Library[]> {
    return [];
  }

  async checkBookAvailability(args: {
    isbn: string[];
    systemIds: string[];
  }): Promise<BookAvailability[]> {
    this.checkCalls.push(args);
    if (this.failWith !== null) throw this.failWith;
    return args.isbn
      .map((isbn) => this.resultsByIsbn[isbn])
      .filter((r): r is BookAvailability => r !== undefined);
  }
}

function availabilityFor(isbn: string): BookAvailability {
  return {
    isbn,
    libraryStatuses: {
      Tokyo_Chiyoda: {
        systemId: "Tokyo_Chiyoda",
        status: AvailabilityStatus.available,
        libKeyStatuses: { 千代田: "貸出可" },
      },
    },
  };
}

function setNavigatorOnline(value: boolean): void {
  Object.defineProperty(window.navigator, "onLine", {
    value,
    configurable: true,
  });
}

function createWrapper(deps: AppDependencies, queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <DependenciesProvider value={deps}>
        <QueryClientProvider client={queryClient}>
          <SnackbarProvider>{children}</SnackbarProvider>
        </QueryClientProvider>
      </DependenciesProvider>
    );
  };
}

describe("usePendingScanProcessor", () => {
  const chiyoda = createLibrary({ systemId: "Tokyo_Chiyoda", libKey: "千代田" });
  let queryClient: QueryClient;

  beforeEach(() => {
    setNavigatorOnline(true);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    setNavigatorOnline(true);
  });

  async function seedQueue(deps: AppDependencies, isbns: string[]): Promise<void> {
    for (const [i, isbn] of isbns.entries()) {
      await deps.pendingScanRepository.add({
        isbn,
        scannedAt: new Date(2026, 7, 1, 10, i),
      });
    }
  }

  test("オンライン時、キュー全体を1回の検索にまとめ、履歴保存してキューを空にする", async () => {
    const libraryRepo = new FakeLibraryRepository({
      "9784003101018": availabilityFor("9784003101018"),
      "9784167158057": availabilityFor("9784167158057"),
    });
    const deps = makeFakeDeps({
      libraryRepository: libraryRepo,
      registeredLibraryRepository: new FakeRegisteredLibraryRepository([
        chiyoda,
      ]),
    });
    await seedQueue(deps, ["9784003101018", "9784167158057"]);

    renderHook(() => usePendingScanProcessor(), {
      wrapper: createWrapper(deps, queryClient),
    });

    await waitFor(async () => {
      expect(await deps.pendingScanRepository.getAll()).toHaveLength(0);
    });

    // 検索は1回にまとめる（NFR-1）。
    expect(libraryRepo.checkCalls).toHaveLength(1);
    expect(libraryRepo.checkCalls[0].isbn).toEqual([
      "9784003101018",
      "9784167158057",
    ]);
    expect(libraryRepo.checkCalls[0].systemIds).toEqual(["Tokyo_Chiyoda"]);

    // 履歴が分館単位ステータスで保存される。
    const history = await deps.searchHistoryRepository.getAll();
    expect(history.map((e) => e.isbn).sort()).toEqual([
      "9784003101018",
      "9784167158057",
    ]);
    const entry = history.find(
      (e) => e.isbn === "9784003101018",
    ) as SearchHistoryEntry;
    expect(entry.libraryStatuses).toEqual({
      [libraryKey(chiyoda)]: "available",
    });

    // 結果画面が再検索なしで開けるよう bookAvailability キャッシュにも反映する。
    const cached = queryClient.getQueryData([
      "bookAvailability",
      "9784003101018",
      ["Tokyo_Chiyoda"],
    ]);
    expect(cached).toEqual([availabilityFor("9784003101018")]);
  });

  test("検索が失敗した場合はキューを維持する（次回再試行）", async () => {
    const libraryRepo = new FakeLibraryRepository({});
    libraryRepo.failWith = new Error("network down");
    const deps = makeFakeDeps({
      libraryRepository: libraryRepo,
      registeredLibraryRepository: new FakeRegisteredLibraryRepository([
        chiyoda,
      ]),
    });
    await seedQueue(deps, ["9784003101018"]);

    renderHook(() => usePendingScanProcessor(), {
      wrapper: createWrapper(deps, queryClient),
    });

    await waitFor(() => expect(libraryRepo.checkCalls).toHaveLength(1));
    expect(await deps.pendingScanRepository.getAll()).toHaveLength(1);
    expect(await deps.searchHistoryRepository.getAll()).toHaveLength(0);
  });

  test("オフライン時は何もしない", async () => {
    setNavigatorOnline(false);
    const libraryRepo = new FakeLibraryRepository({
      "9784003101018": availabilityFor("9784003101018"),
    });
    const deps = makeFakeDeps({
      libraryRepository: libraryRepo,
      registeredLibraryRepository: new FakeRegisteredLibraryRepository([
        chiyoda,
      ]),
    });
    await seedQueue(deps, ["9784003101018"]);

    renderHook(() => usePendingScanProcessor(), {
      wrapper: createWrapper(deps, queryClient),
    });

    // 非同期処理が走らないことを確認するため、少し待ってから検証する。
    await new Promise((r) => setTimeout(r, 50));
    expect(libraryRepo.checkCalls).toHaveLength(0);
    expect(await deps.pendingScanRepository.getAll()).toHaveLength(1);
  });

  test("登録図書館が0件のときは何もしない", async () => {
    const libraryRepo = new FakeLibraryRepository({
      "9784003101018": availabilityFor("9784003101018"),
    });
    const deps = makeFakeDeps({
      libraryRepository: libraryRepo,
      registeredLibraryRepository: new FakeRegisteredLibraryRepository([]),
    });
    await seedQueue(deps, ["9784003101018"]);

    renderHook(() => usePendingScanProcessor(), {
      wrapper: createWrapper(deps, queryClient),
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(libraryRepo.checkCalls).toHaveLength(0);
    expect(await deps.pendingScanRepository.getAll()).toHaveLength(1);
  });

  test("キューが空のときは検索しない", async () => {
    const libraryRepo = new FakeLibraryRepository({});
    const deps = makeFakeDeps({
      libraryRepository: libraryRepo,
      registeredLibraryRepository: new FakeRegisteredLibraryRepository([
        chiyoda,
      ]),
    });

    renderHook(() => usePendingScanProcessor(), {
      wrapper: createWrapper(deps, queryClient),
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(libraryRepo.checkCalls).toHaveLength(0);
  });
});
