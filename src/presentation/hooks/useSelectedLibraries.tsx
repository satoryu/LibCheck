import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Library } from '@/domain/models/library';
import { libraryKey } from '@/domain/models/library';

export interface SelectedLibrariesContextValue {
  selected: Library[];
  isSelected(lib: Library): boolean;
  toggle(lib: Library): void;
  clear(): void;
}

const SelectedLibrariesContext =
  createContext<SelectedLibrariesContextValue | null>(null);

/**
 * 図書館一覧画面での選択状態を保持する（永続化しない一時的な状態）。
 *
 * `library_list_providers.dart` の `selectedLibrariesProvider` の移植。
 * メンバーシップ判定は `libraryKey` で行う。
 */
export const SelectedLibrariesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [selected, setSelected] = useState<Library[]>([]);

  const isSelected = useCallback(
    (lib: Library): boolean => {
      const key = libraryKey(lib);
      return selected.some((l) => libraryKey(l) === key);
    },
    [selected],
  );

  const toggle = useCallback((lib: Library): void => {
    const key = libraryKey(lib);
    setSelected((prev) => {
      if (prev.some((l) => libraryKey(l) === key)) {
        return prev.filter((l) => libraryKey(l) !== key);
      }
      return [...prev, lib];
    });
  }, []);

  const clear = useCallback((): void => {
    setSelected([]);
  }, []);

  const value = useMemo<SelectedLibrariesContextValue>(
    () => ({ selected, isSelected, toggle, clear }),
    [selected, isSelected, toggle, clear],
  );

  return (
    <SelectedLibrariesContext.Provider value={value}>
      {children}
    </SelectedLibrariesContext.Provider>
  );
};

export function useSelectedLibraries(): SelectedLibrariesContextValue {
  const ctx = useContext(SelectedLibrariesContext);
  if (ctx === null) {
    throw new Error(
      'useSelectedLibraries must be used within a SelectedLibrariesProvider',
    );
  }
  return ctx;
}
