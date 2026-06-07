import React from "react";
import { describe, test, expect, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DependenciesProvider } from "@/app/dependencies";
import type { AppDependencies } from "@/app/dependencies";
import { makeFakeDeps } from "@/test/testUtils";
import { SelectedLibrariesProvider } from "@/presentation/hooks/useSelectedLibraries";
import {
  useSearchHistory,
  useSearchHistoryMutations,
} from "@/presentation/hooks/useSearchHistory";
import type { SearchHistoryEntry } from "@/domain/models/searchHistoryEntry";
import type { SearchHistoryRepository } from "@/domain/repositories/searchHistoryRepository";

class FakeSearchHistoryRepository implements SearchHistoryRepository {
  private entries: SearchHistoryEntry[] = [];

  async getAll(): Promise<SearchHistoryEntry[]> {
    const sorted = [...this.entries];
    sorted.sort((a, b) => b.searchedAt.getTime() - a.searchedAt.getTime());
    return sorted;
  }

  async save(entry: SearchHistoryEntry): Promise<void> {
    this.entries = this.entries.filter((e) => e.isbn !== entry.isbn);
    this.entries.push(entry);
  }

  async remove(isbn: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.isbn !== isbn);
  }

  async removeAll(): Promise<void> {
    this.entries = [];
  }
}

function createWrapper(deps: AppDependencies) {
  const queryClient = new QueryClient({
    // `notifyOnChangeProps: "all"` bypasses React Query v5's tracked-props
    // optimisation. Without it, a setQueryData update after a mutation does not
    // re-render here because only `isSuccess` was accessed before the mutation,
    // so `data` changes go unnotified and waitFor times out.
    defaultOptions: { queries: { retry: false, notifyOnChangeProps: "all" } },
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

describe("searchHistory hooks", () => {
  let fakeRepo: FakeSearchHistoryRepository;
  let deps: AppDependencies;

  beforeEach(() => {
    fakeRepo = new FakeSearchHistoryRepository();
    deps = makeFakeDeps({ searchHistoryRepository: fakeRepo });
  });

  test("initial state loads from repository", async () => {
    await fakeRepo.save({
      isbn: "9784003101018",
      searchedAt: new Date(2026, 1, 15),
      libraryStatuses: { Tokyo_Chiyoda: "available" },
    });

    const { result } = renderHook(() => useSearchHistory(), {
      wrapper: createWrapper(deps),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data ?? [];
    expect(data).toHaveLength(1);
    expect(data[0].isbn).toBe("9784003101018");
  });

  test("save adds entry and updates state", async () => {
    const { result } = renderHook(
      () => ({
        query: useSearchHistory(),
        mutations: useSearchHistoryMutations(),
      }),
      { wrapper: createWrapper(deps) },
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    await act(async () => {
      await result.current.mutations.save({
        isbn: "9784003101018",
        searchedAt: new Date(2026, 1, 15),
        libraryStatuses: { Tokyo_Chiyoda: "available" },
      });
    });

    await waitFor(() => expect(result.current.query.data).toHaveLength(1));
    expect((result.current.query.data ?? [])[0].isbn).toBe("9784003101018");
  });
});
