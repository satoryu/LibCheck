import React from "react";
import { describe, test, expect, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DependenciesProvider } from "@/app/dependencies";
import type { AppDependencies } from "@/app/dependencies";
import { makeFakeDeps } from "@/test/testUtils";
import {
  usePendingScans,
  usePendingScanMutations,
} from "@/presentation/hooks/usePendingScans";
import type { PendingScan } from "@/domain/models/pendingScan";
import type { PendingScanRepository } from "@/domain/repositories/pendingScanRepository";

class FakePendingScanRepository implements PendingScanRepository {
  private scans: PendingScan[] = [];
  getAllCallCount = 0;

  private sorted(): PendingScan[] {
    const sorted = [...this.scans];
    sorted.sort((a, b) => a.scannedAt.getTime() - b.scannedAt.getTime());
    return sorted;
  }

  async getAll(): Promise<PendingScan[]> {
    this.getAllCallCount += 1;
    return this.sorted();
  }

  async add(scan: PendingScan): Promise<PendingScan[]> {
    if (!this.scans.some((s) => s.isbn === scan.isbn)) {
      this.scans.push(scan);
    }
    return this.sorted();
  }

  async remove(isbn: string): Promise<PendingScan[]> {
    this.scans = this.scans.filter((s) => s.isbn !== isbn);
    return this.sorted();
  }

  async removeAll(): Promise<PendingScan[]> {
    this.scans = [];
    return [];
  }
}

function createWrapper(deps: AppDependencies) {
  const queryClient = new QueryClient({
    // useSearchHistory.test.tsx と同じ理由: tracked-props 最適化を外さないと
    // mutation 後の setQueryData が re-render を起こさず waitFor がタイムアウトする。
    defaultOptions: { queries: { retry: false, notifyOnChangeProps: "all" } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <DependenciesProvider value={deps}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </DependenciesProvider>
    );
  };
}

describe("pendingScan hooks", () => {
  let fakeRepo: FakePendingScanRepository;
  let deps: AppDependencies;

  beforeEach(() => {
    fakeRepo = new FakePendingScanRepository();
    deps = makeFakeDeps({ pendingScanRepository: fakeRepo });
  });

  test("initial state loads from repository", async () => {
    await fakeRepo.add({
      isbn: "9784003101018",
      scannedAt: new Date(2026, 7, 1),
    });

    const { result } = renderHook(() => usePendingScans(), {
      wrapper: createWrapper(deps),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((result.current.data ?? []).map((s) => s.isbn)).toEqual([
      "9784003101018",
    ]);
  });

  test("add はリポジトリの戻り値でキャッシュを更新し、再 getAll しない", async () => {
    const { result } = renderHook(
      () => ({
        query: usePendingScans(),
        mutations: usePendingScanMutations(),
      }),
      { wrapper: createWrapper(deps) },
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    const callsAfterInitialLoad = fakeRepo.getAllCallCount;

    await act(async () => {
      await result.current.mutations.add({
        isbn: "9784003101018",
        scannedAt: new Date(2026, 7, 1),
      });
    });

    await waitFor(() => expect(result.current.query.data).toHaveLength(1));
    expect(fakeRepo.getAllCallCount).toBe(callsAfterInitialLoad);
  });

  test("remove もキャッシュを直接更新する", async () => {
    await fakeRepo.add({
      isbn: "9784003101018",
      scannedAt: new Date(2026, 7, 1),
    });
    await fakeRepo.add({
      isbn: "9784167158057",
      scannedAt: new Date(2026, 7, 2),
    });

    const { result } = renderHook(
      () => ({
        query: usePendingScans(),
        mutations: usePendingScanMutations(),
      }),
      { wrapper: createWrapper(deps) },
    );

    await waitFor(() => expect(result.current.query.data).toHaveLength(2));
    const callsAfterInitialLoad = fakeRepo.getAllCallCount;

    await act(async () => {
      await result.current.mutations.remove("9784003101018");
    });

    await waitFor(() => expect(result.current.query.data).toHaveLength(1));
    expect((result.current.query.data ?? [])[0].isbn).toBe("9784167158057");
    expect(fakeRepo.getAllCallCount).toBe(callsAfterInitialLoad);
  });
});
