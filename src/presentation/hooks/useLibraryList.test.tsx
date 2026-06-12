import React from "react";
import { describe, test, expect } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DependenciesProvider } from "@/app/dependencies";
import type { AppDependencies } from "@/app/dependencies";
import { makeFakeDeps } from "@/test/testUtils";
import { SelectedLibrariesProvider } from "@/presentation/hooks/useSelectedLibraries";
import { useSelectedLibraries } from "@/presentation/hooks/useSelectedLibraries";
import { useLibraryList } from "@/presentation/hooks/useLibraryList";
import type { LibraryListParam } from "@/presentation/hooks/useLibraryList";
import type { BookAvailability } from "@/domain/models/bookAvailability";
import type { Library } from "@/domain/models/library";
import type { LibraryRepository } from "@/domain/repositories/libraryRepository";

class MockLibraryRepository implements LibraryRepository {
  constructor(private readonly libraries: Library[]) {}

  async getLibraries(args: {
    pref: string;
    city?: string;
  }): Promise<Library[]> {
    return this.libraries.filter(
      (lib) =>
        lib.pref === args.pref &&
        (args.city === undefined || lib.city === args.city),
    );
  }

  async checkBookAvailability(): Promise<BookAvailability[]> {
    return [];
  }
}

function createLibrary(args: {
  pref: string;
  city: string;
  formalName: string;
  address: string;
  systemId?: string;
  libKey?: string;
  libId?: string;
}): Library {
  return {
    systemId: args.systemId ?? "system1",
    systemName: "テスト図書館システム",
    libKey: args.libKey ?? "key1",
    libId: args.libId ?? "id1",
    shortName: args.formalName,
    formalName: args.formalName,
    address: args.address,
    pref: args.pref,
    city: args.city,
    category: "MEDIUM",
  };
}

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

describe("LibraryListParam", () => {
  test("two params with same pref and city are equal", () => {
    const param1: LibraryListParam = { pref: "東京都", city: "港区" };
    const param2: LibraryListParam = { pref: "東京都", city: "港区" };
    expect(param1).toEqual(param2);
  });
});

describe("useLibraryList", () => {
  test("returns libraries for the specified pref and city", async () => {
    const libraries = [
      createLibrary({
        pref: "東京都",
        city: "港区",
        formalName: "東京都立中央図書館",
        address: "東京都港区南麻布5-7-13",
        libId: "1",
      }),
      createLibrary({
        pref: "東京都",
        city: "港区",
        formalName: "港区立みなと図書館",
        address: "東京都港区芝浦3-16-25",
        libId: "2",
      }),
      createLibrary({
        pref: "東京都",
        city: "新宿区",
        formalName: "新宿区立中央図書館",
        address: "東京都新宿区大久保3-1-1",
        libId: "3",
      }),
    ];

    const deps = makeFakeDeps({
      libraryRepository: new MockLibraryRepository(libraries),
    });

    const param: LibraryListParam = { pref: "東京都", city: "港区" };
    const { result } = renderHook(() => useLibraryList(param), {
      wrapper: createWrapper(deps),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data ?? [];
    expect(data).toHaveLength(2);
    expect(data[0].formalName).toBe("東京都立中央図書館");
    expect(data[1].formalName).toBe("港区立みなと図書館");
  });
});

describe("useSelectedLibraries", () => {
  test("toggle adds a library", () => {
    const deps = makeFakeDeps();
    const lib = createLibrary({
      pref: "東京都",
      city: "港区",
      formalName: "テスト図書館",
      address: "東京都港区",
    });

    const { result } = renderHook(() => useSelectedLibraries(), {
      wrapper: createWrapper(deps),
    });

    act(() => {
      result.current.toggle(lib);
    });

    expect(result.current.isSelected(lib)).toBe(true);
    expect(result.current.selected).toContainEqual(lib);
  });
});
