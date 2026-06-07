import React, { createContext, useContext } from "react";
import type { LocalStorageRepository } from "@/domain/repositories/localStorageRepository";
import type { LibraryRepository } from "@/domain/repositories/libraryRepository";
import type { RegisteredLibraryRepository } from "@/domain/repositories/registeredLibraryRepository";
import type { SearchHistoryRepository } from "@/domain/repositories/searchHistoryRepository";
import { CalilApiClient } from "@/data/datasources/calilApiClient";
import { CALIL_API_CONFIG } from "@/data/datasources/calilApiConfig";
import { WebLocalStorageRepository } from "@/data/repositories/localStorageRepositoryImpl";
import { LibraryRepositoryImpl } from "@/data/repositories/libraryRepositoryImpl";
import { RegisteredLibraryRepositoryImpl } from "@/data/repositories/registeredLibraryRepositoryImpl";
import { SearchHistoryRepositoryImpl } from "@/data/repositories/searchHistoryRepositoryImpl";

export interface AppDependencies {
  localStorageRepository: LocalStorageRepository;
  calilApiClient: CalilApiClient;
  libraryRepository: LibraryRepository;
  registeredLibraryRepository: RegisteredLibraryRepository;
  searchHistoryRepository: SearchHistoryRepository;
}

export function createDefaultDependencies(): AppDependencies {
  const localStorageRepository = new WebLocalStorageRepository();
  const calilApiClient = new CalilApiClient({
    appKey: CALIL_API_CONFIG.appKey,
  });
  const libraryRepository = new LibraryRepositoryImpl({
    apiClient: calilApiClient,
  });
  const registeredLibraryRepository = new RegisteredLibraryRepositoryImpl(
    localStorageRepository,
  );
  const searchHistoryRepository = new SearchHistoryRepositoryImpl(
    localStorageRepository,
  );

  return {
    localStorageRepository,
    calilApiClient,
    libraryRepository,
    registeredLibraryRepository,
    searchHistoryRepository,
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
