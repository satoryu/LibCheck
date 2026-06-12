import React from "react";
import { describe, test, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DependenciesProvider } from "@/app/dependencies";
import type { AppDependencies } from "@/app/dependencies";
import { makeFakeDeps } from "@/test/testUtils";
import { SelectedLibrariesProvider } from "@/presentation/hooks/useSelectedLibraries";
import { useCityList } from "@/presentation/hooks/useCityList";
import type { BookAvailability } from "@/domain/models/bookAvailability";
import type { Library } from "@/domain/models/library";
import type { LibraryRepository } from "@/domain/repositories/libraryRepository";

class MockLibraryRepository implements LibraryRepository {
  constructor(private readonly libraries: Library[]) {}

  async getLibraries(args: {
    pref: string;
    city?: string;
  }): Promise<Library[]> {
    return this.libraries.filter((lib) => lib.pref === args.pref);
  }

  async checkBookAvailability(): Promise<BookAvailability[]> {
    return [];
  }
}

function createLibrary(args: {
  pref: string;
  city: string;
  systemId?: string;
  libKey?: string;
  libId?: string;
}): Library {
  return {
    systemId: args.systemId ?? "system1",
    systemName: "テスト図書館システム",
    libKey: args.libKey ?? "key1",
    libId: args.libId ?? "id1",
    shortName: "テスト図書館",
    formalName: "テスト図書館",
    address: `${args.pref}${args.city}`,
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

describe("useCityList", () => {
  test("returns unique sorted city names from libraries", async () => {
    const libraries = [
      createLibrary({ pref: "東京都", city: "港区", libId: "1" }),
      createLibrary({ pref: "東京都", city: "千代田区", libId: "2" }),
      createLibrary({ pref: "東京都", city: "港区", libId: "3" }),
      createLibrary({ pref: "東京都", city: "新宿区", libId: "4" }),
    ];

    const deps = makeFakeDeps({
      libraryRepository: new MockLibraryRepository(libraries),
    });

    const { result } = renderHook(() => useCityList("東京都"), {
      wrapper: createWrapper(deps),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(["千代田区", "新宿区", "港区"]);
  });
});
