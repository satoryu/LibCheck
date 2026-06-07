import React from "react";
import { describe, test, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DependenciesProvider } from "@/app/dependencies";
import type { AppDependencies } from "@/app/dependencies";
import { makeFakeDeps } from "@/test/testUtils";
import { SelectedLibrariesProvider } from "@/presentation/hooks/useSelectedLibraries";
import { useBookAvailability } from "@/presentation/hooks/useBookAvailability";
import { AvailabilityStatus } from "@/domain/models/availabilityStatus";
import type { BookAvailability } from "@/domain/models/bookAvailability";
import type { Library } from "@/domain/models/library";
import type { LibraryRepository } from "@/domain/repositories/libraryRepository";
import type { RegisteredLibraryRepository } from "@/domain/repositories/registeredLibraryRepository";

class FakeLibraryRepository implements LibraryRepository {
  capturedIsbn: string[] | null = null;
  capturedSystemIds: string[] | null = null;

  constructor(private readonly result: BookAvailability[] = []) {}

  async getLibraries(): Promise<Library[]> {
    return [];
  }

  async checkBookAvailability(args: {
    isbn: string[];
    systemIds: string[];
  }): Promise<BookAvailability[]> {
    this.capturedIsbn = args.isbn;
    this.capturedSystemIds = args.systemIds;
    return this.result;
  }
}

class FakeRegisteredLibraryRepository implements RegisteredLibraryRepository {
  constructor(private readonly libraries: Library[] = []) {}

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

const library1: Library = {
  systemId: "Tokyo_Minato",
  systemName: "港区図書館",
  libKey: "みなと",
  libId: "123",
  shortName: "みなと図書館",
  formalName: "港区立みなと図書館",
  address: "東京都港区芝公園3-2-25",
  pref: "東京都",
  city: "港区",
  category: "MEDIUM",
};

const library2: Library = {
  systemId: "Tokyo_Shibuya",
  systemName: "渋谷区図書館",
  libKey: "しぶや",
  libId: "456",
  shortName: "渋谷図書館",
  formalName: "渋谷区立中央図書館",
  address: "東京都渋谷区神宮前1-1-1",
  pref: "東京都",
  city: "渋谷区",
  category: "LARGE",
};

function createWrapper(deps: AppDependencies) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <DependenciesProvider value={deps}>
        <QueryClientProvider client={queryClient}>
          <SelectedLibrariesProvider>{children}</SelectedLibrariesProvider>
        </QueryClientProvider>
      </DependenciesProvider>
    );
  };
}

describe("useBookAvailability", () => {
  test("returns availability results for registered libraries", async () => {
    const expectedResult: BookAvailability[] = [
      {
        isbn: "9784123456789",
        libraryStatuses: {
          Tokyo_Minato: {
            systemId: "Tokyo_Minato",
            status: AvailabilityStatus.available,
            libKeyStatuses: { みなと: "貸出可" },
          },
        },
      },
    ];

    const fakeLibraryRepo = new FakeLibraryRepository(expectedResult);
    const fakeRegisteredRepo = new FakeRegisteredLibraryRepository([
      library1,
      library2,
    ]);

    const deps = makeFakeDeps({
      libraryRepository: fakeLibraryRepo,
      registeredLibraryRepository: fakeRegisteredRepo,
    });

    const { result } = renderHook(
      () => useBookAvailability("9784123456789"),
      { wrapper: createWrapper(deps) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data ?? [];
    expect(data).toHaveLength(1);
    expect(data[0].isbn).toBe("9784123456789");
    expect(fakeLibraryRepo.capturedIsbn).toEqual(["9784123456789"]);
    expect(fakeLibraryRepo.capturedSystemIds).toEqual(
      expect.arrayContaining(["Tokyo_Minato", "Tokyo_Shibuya"]),
    );
  });

  test("returns empty list when no libraries registered", async () => {
    const fakeLibraryRepo = new FakeLibraryRepository();
    const fakeRegisteredRepo = new FakeRegisteredLibraryRepository();

    const deps = makeFakeDeps({
      libraryRepository: fakeLibraryRepo,
      registeredLibraryRepository: fakeRegisteredRepo,
    });

    const { result } = renderHook(
      () => useBookAvailability("9784123456789"),
      { wrapper: createWrapper(deps) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
    expect(fakeLibraryRepo.capturedIsbn).toBeNull();
  });

  test("deduplicates systemIds from registered libraries", async () => {
    const lib1: Library = {
      systemId: "Tokyo_Minato",
      systemName: "港区図書館",
      libKey: "みなと",
      libId: "123",
      shortName: "みなと図書館",
      formalName: "みなと図書館",
      address: "住所1",
      pref: "東京都",
      city: "港区",
      category: "MEDIUM",
    };
    const lib2: Library = {
      systemId: "Tokyo_Minato",
      systemName: "港区図書館",
      libKey: "高輪",
      libId: "789",
      shortName: "高輪図書館",
      formalName: "高輪図書館",
      address: "住所2",
      pref: "東京都",
      city: "港区",
      category: "SMALL",
    };

    const fakeLibraryRepo = new FakeLibraryRepository();
    const fakeRegisteredRepo = new FakeRegisteredLibraryRepository([
      lib1,
      lib2,
    ]);

    const deps = makeFakeDeps({
      libraryRepository: fakeLibraryRepo,
      registeredLibraryRepository: fakeRegisteredRepo,
    });

    const { result } = renderHook(
      () => useBookAvailability("9784123456789"),
      { wrapper: createWrapper(deps) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fakeLibraryRepo.capturedSystemIds).toHaveLength(1);
    expect(fakeLibraryRepo.capturedSystemIds).toEqual(["Tokyo_Minato"]);
  });
});
