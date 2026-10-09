import React from "react";
import { render, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";
import { ThemeProvider } from "@mui/material/styles";
import { MemoryRouter, RouterProvider, createMemoryRouter } from "react-router-dom";
import { theme } from "@/theme";
import {
  DependenciesProvider,
  type AppDependencies,
} from "@/app/dependencies";
import { SelectedLibrariesProvider } from "@/presentation/hooks/useSelectedLibraries";
import { AuthProvider } from "@/presentation/auth/AuthProvider";
import type { User } from "@/domain/models/user";
import { routes } from "@/app/router";
import type { LocalStorageRepository } from "@/domain/repositories/localStorageRepository";
import type { BookMetadata } from "@/domain/models/bookMetadata";
import type { BookMetadataRepository } from "@/domain/repositories/bookMetadataRepository";
import type { TrialCheckRepository } from "@/domain/repositories/trialCheckRepository";
import type { TrialCheckResult } from "@/domain/models/trialCheckResult";
import { CalilApiClient } from "@/data/datasources/calilApiClient";
import { OpenBdApiClient } from "@/data/datasources/openBdApiClient";
import { StaticLibraryDataSource } from "@/data/datasources/staticLibraryDataSource";
import { LibraryRepositoryImpl } from "@/data/repositories/libraryRepositoryImpl";
import { RegisteredLibraryRepositoryImpl } from "@/data/repositories/registeredLibraryRepositoryImpl";
import { SearchHistoryRepositoryImpl } from "@/data/repositories/searchHistoryRepositoryImpl";
import { PendingScanRepositoryImpl } from "@/data/repositories/pendingScanRepositoryImpl";

export class FakeLocalStorageRepository implements LocalStorageRepository {
  private store = new Map<string, string>();
  private listStore = new Map<string, string[]>();

  async getString(key: string): Promise<string | null> {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  async setString(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async getStringList(key: string): Promise<string[] | null> {
    return this.listStore.has(key)
      ? [...(this.listStore.get(key) as string[])]
      : null;
  }

  async setStringList(key: string, value: string[]): Promise<void> {
    this.listStore.set(key, [...value]);
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
    this.listStore.delete(key);
  }
}

/**
 * 既定では該当なし(null)を返す書籍メタデータリポジトリ。
 * コンストラクタに ISBN→BookMetadata のマップを渡すと該当を返す。
 */
export class FakeBookMetadataRepository implements BookMetadataRepository {
  constructor(private readonly byIsbn: Record<string, BookMetadata> = {}) {}

  async getByIsbn(isbn: string): Promise<BookMetadata | null> {
    return this.byIsbn[isbn] ?? null;
  }

  async getByIsbns(isbns: string[]): Promise<Map<string, BookMetadata>> {
    const map = new Map<string, BookMetadata>();
    for (const isbn of isbns) {
      const found = this.byIsbn[isbn];
      if (found) map.set(isbn, found);
    }
    return map;
  }
}

/**
 * 体験版（#183）のフェイク。既定は対象館が無い完了済みの結果を返す。
 * テストでは `check` を差し替えて使う。
 */
export class FakeTrialCheckRepository implements TrialCheckRepository {
  calls: { isbn: string; pref: string; city: string }[] = [];
  constructor(
    private readonly respond: (args: { isbn: string; pref: string; city: string }) => Promise<TrialCheckResult> =
      async (args) => ({ isbn: args.isbn, libraries: [], omittedLibraryCount: 0, complete: true }),
  ) {}

  async check(args: { isbn: string; pref: string; city: string }): Promise<TrialCheckResult> {
    this.calls.push(args);
    return this.respond(args);
  }
}

export function makeFakeDeps(
  overrides?: Partial<AppDependencies>,
): AppDependencies {
  const localStorageRepository =
    overrides?.localStorageRepository ?? new FakeLocalStorageRepository();
  const calilApiClient =
    overrides?.calilApiClient ??
    new CalilApiClient({
      appKey: "test-app-key",
      pollingIntervalMs: 0,
      fetchFn: async () =>
        new Response("[]", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    });
  const libraryRepository =
    overrides?.libraryRepository ??
    new LibraryRepositoryImpl({
      apiClient: calilApiClient,
      staticLibraryDataSource: new StaticLibraryDataSource({
        fetchFn: async () =>
          new Response("[]", {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      }),
    });
  const registeredLibraryRepository =
    overrides?.registeredLibraryRepository ??
    new RegisteredLibraryRepositoryImpl(localStorageRepository);
  const searchHistoryRepository =
    overrides?.searchHistoryRepository ??
    new SearchHistoryRepositoryImpl(localStorageRepository);
  const openBdApiClient =
    overrides?.openBdApiClient ??
    new OpenBdApiClient({
      fetchFn: async () =>
        new Response("[null]", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    });
  const bookMetadataRepository =
    overrides?.bookMetadataRepository ?? new FakeBookMetadataRepository();
  const pendingScanRepository =
    overrides?.pendingScanRepository ??
    new PendingScanRepositoryImpl(localStorageRepository);
  const trialCheckRepository =
    overrides?.trialCheckRepository ?? new FakeTrialCheckRepository();

  return {
    localStorageRepository,
    calilApiClient,
    openBdApiClient,
    libraryRepository,
    registeredLibraryRepository,
    searchHistoryRepository,
    bookMetadataRepository,
    pendingScanRepository,
    trialCheckRepository,
  };
}

function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

export interface RenderWithProvidersOptions {
  deps?: AppDependencies;
  route?: string;
  queryClient?: QueryClient;
  authUser?: User | null;
}

export interface RenderWithProvidersResult extends RenderResult {
  user: UserEvent;
  deps: AppDependencies;
  queryClient: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactNode,
  options?: RenderWithProvidersOptions,
): RenderWithProvidersResult {
  const deps = options?.deps ?? makeFakeDeps();
  const queryClient = options?.queryClient ?? makeTestQueryClient();
  const route = options?.route ?? "/";

  const result = render(
    <DependenciesProvider value={deps}>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
          <ThemeProvider theme={theme}>
            <AuthProvider initialUser={options?.authUser ?? null}>
              <SelectedLibrariesProvider>
                <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
              </SelectedLibrariesProvider>
            </AuthProvider>
          </ThemeProvider>
        </SnackbarProvider>
      </QueryClientProvider>
    </DependenciesProvider>,
  );

  return {
    ...result,
    user: userEvent.setup(),
    deps,
    queryClient,
  };
}

export interface RenderRouteOptions {
  deps?: AppDependencies;
  queryClient?: QueryClient;
  authUser?: User | null;
}

export function renderRouteWithProviders(
  route: string,
  options?: RenderRouteOptions,
): RenderWithProvidersResult {
  const deps = options?.deps ?? makeFakeDeps();
  const queryClient = options?.queryClient ?? makeTestQueryClient();
  const router = createMemoryRouter(routes, { initialEntries: [route] });

  const result = render(
    <DependenciesProvider value={deps}>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
          <ThemeProvider theme={theme}>
            <AuthProvider initialUser={options?.authUser ?? null}>
              <SelectedLibrariesProvider>
                <RouterProvider router={router} />
              </SelectedLibrariesProvider>
            </AuthProvider>
          </ThemeProvider>
        </SnackbarProvider>
      </QueryClientProvider>
    </DependenciesProvider>,
  );

  return {
    ...result,
    user: userEvent.setup(),
    deps,
    queryClient,
  };
}
