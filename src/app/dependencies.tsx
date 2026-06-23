import React, { createContext, useContext } from "react";
import type { LocalStorageRepository } from "@/domain/repositories/localStorageRepository";
import type { LibraryRepository } from "@/domain/repositories/libraryRepository";
import type { RegisteredLibraryRepository } from "@/domain/repositories/registeredLibraryRepository";
import type { SearchHistoryRepository } from "@/domain/repositories/searchHistoryRepository";
import type { BookMetadataRepository } from "@/domain/repositories/bookMetadataRepository";
import { CalilApiClient } from "@/data/datasources/calilApiClient";
import { CALIL_API_CONFIG } from "@/data/datasources/calilApiConfig";
import { OpenBdApiClient } from "@/data/datasources/openBdApiClient";
import { RegisteredLibraryApiClient } from "@/data/datasources/registeredLibraryApiClient";
import { SearchHistoryApiClient } from "@/data/datasources/searchHistoryApiClient";
import { WebLocalStorageRepository } from "@/data/repositories/localStorageRepositoryImpl";
import { LibraryRepositoryImpl } from "@/data/repositories/libraryRepositoryImpl";
import { ServerRegisteredLibraryRepositoryImpl } from "@/data/repositories/serverRegisteredLibraryRepositoryImpl";
import { ServerSearchHistoryRepositoryImpl } from "@/data/repositories/serverSearchHistoryRepositoryImpl";
import { BookMetadataRepositoryImpl } from "@/data/repositories/bookMetadataRepositoryImpl";

export interface AppDependencies {
  localStorageRepository: LocalStorageRepository;
  calilApiClient: CalilApiClient;
  openBdApiClient: OpenBdApiClient;
  libraryRepository: LibraryRepository;
  registeredLibraryRepository: RegisteredLibraryRepository;
  searchHistoryRepository: SearchHistoryRepository;
  bookMetadataRepository: BookMetadataRepository;
}

export function createDefaultDependencies(): AppDependencies {
  const localStorageRepository = new WebLocalStorageRepository();
  const calilApiClient = new CalilApiClient({
    appKey: CALIL_API_CONFIG.appKey,
  });
  const openBdApiClient = new OpenBdApiClient();
  const libraryRepository = new LibraryRepositoryImpl({
    apiClient: calilApiClient,
  });
  // 登録図書館・検索履歴はサーバー（D1）に永続化する（#74）。トークンは
  // AuthTokenStore から取得する（AuthProvider が同期）。
  const registeredLibraryRepository = new ServerRegisteredLibraryRepositoryImpl(
    new RegisteredLibraryApiClient(),
  );
  const searchHistoryRepository = new ServerSearchHistoryRepositoryImpl(
    new SearchHistoryApiClient(),
  );
  const bookMetadataRepository = new BookMetadataRepositoryImpl(openBdApiClient);

  return {
    localStorageRepository,
    calilApiClient,
    openBdApiClient,
    libraryRepository,
    registeredLibraryRepository,
    searchHistoryRepository,
    bookMetadataRepository,
  };
}

const DependenciesContext = createContext<AppDependencies | null>(null);

export const DependenciesProvider: React.FC<{
  value: AppDependencies;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <DependenciesContext.Provider value={value}>
      {children}
    </DependenciesContext.Provider>
  );
};

export function useDeps(): AppDependencies {
  const deps = useContext(DependenciesContext);
  if (deps === null) {
    throw new Error("useDeps must be used within a DependenciesProvider");
  }
  return deps;
}
