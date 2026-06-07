import React from "react";
import { describe, test, expect, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DependenciesProvider } from "@/app/dependencies";
import type { AppDependencies } from "@/app/dependencies";
import { makeFakeDeps } from "@/test/testUtils";
import { SelectedLibrariesProvider } from "@/presentation/hooks/useSelectedLibraries";
import {
  useRegisteredLibraries,
  useRegisteredLibraryMutations,
} from "@/presentation/hooks/useRegisteredLibraries";
import { librariesEqual } from "@/domain/models/library";
import type { Library } from "@/domain/models/library";
import type { RegisteredLibraryRepository } from "@/domain/repositories/registeredLibraryRepository";

class FakeRegisteredLibraryRepository implements RegisteredLibraryRepository {
  private libraries: Library[] = [];

  async getAll(): Promise<Library[]> {
    return [...this.libraries];
  }

  async saveAll(libraries: Library[]): Promise<void> {
    this.libraries = [...libraries];
  }

  async add(library: Library): Promise<Library[]> {
    if (!this.libraries.some((e) => librariesEqual(e, library))) {
      this.libraries.push(library);
    }
    return [...this.libraries];
  }

  async addAll(libraries: Library[]): Promise<Library[]> {
    for (const lib of libraries) {
      if (!this.libraries.some((e) => librariesEqual(e, lib))) {
        this.libraries.push(lib);
      }
    }
    return [...this.libraries];
  }

  async remove(library: Library): Promise<Library[]> {
    this.libraries = this.libraries.filter((e) => !librariesEqual(e, library));
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

describe("registeredLibraries hooks", () => {
  let fakeRepo: FakeRegisteredLibraryRepository;
  let deps: AppDependencies;

  beforeEach(() => {
    fakeRepo = new FakeRegisteredLibraryRepository();
    deps = makeFakeDeps({ registeredLibraryRepository: fakeRepo });
  });

  test("initial state loads from repository", async () => {
    await fakeRepo.addAll([library1, library2]);

    const { result } = renderHook(() => useRegisteredLibraries(), {
      wrapper: createWrapper(deps),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  test("add adds a library and updates state", async () => {
    const { result } = renderHook(
      () => ({
        query: useRegisteredLibraries(),
        mutations: useRegisteredLibraryMutations(),
      }),
      { wrapper: createWrapper(deps) },
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await act(async () => {
      await result.current.mutations.add(library1);
    });

    await waitFor(() =>
      expect(result.current.query.data).toContainEqual(library1),
    );
  });

  test("remove removes a library and updates state", async () => {
    await fakeRepo.addAll([library1, library2]);

    const { result } = renderHook(
      () => ({
        query: useRegisteredLibraries(),
        mutations: useRegisteredLibraryMutations(),
      }),
      { wrapper: createWrapper(deps) },
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await act(async () => {
      await result.current.mutations.remove(library1);
    });

    await waitFor(() =>
      expect(result.current.query.data).toHaveLength(1),
    );
    expect(result.current.query.data).not.toContainEqual(library1);
  });
});
