import React from "react";
import { describe, test, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DependenciesProvider } from "@/app/dependencies";
import type { AppDependencies } from "@/app/dependencies";
import { makeFakeDeps } from "@/test/testUtils";
import { SelectedLibrariesProvider } from "@/presentation/hooks/useSelectedLibraries";
import { useSelectedLibraries } from "@/presentation/hooks/useSelectedLibraries";
import type { Library } from "@/domain/models/library";

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
