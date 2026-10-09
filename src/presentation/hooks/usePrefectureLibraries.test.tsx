import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { DependenciesProvider } from '@/app/dependencies';
import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import type { LibraryRepository } from '@/domain/repositories/libraryRepository';
import { usePrefectureLibraries } from '@/presentation/hooks/usePrefectureLibraries';
import { makeFakeDeps } from '@/test/testUtils';

function createLibrary(city: string, libId: string): Library {
  return {
    systemId: 'system1',
    systemName: 'テスト図書館システム',
    libKey: libId,
    libId,
    shortName: 'テスト図書館',
    formalName: 'テスト図書館',
    address: `東京都${city}`,
    pref: '東京都',
    city,
    category: 'MEDIUM',
  };
}

describe('usePrefectureLibraries', () => {
  test('都道府県の図書館を全件返し、同じ都道府県なら1回だけ取得する', async () => {
    const libraries = [createLibrary('港区', '1'), createLibrary('新宿区', '2')];
    const getLibraries = vi.fn(async () => libraries);
    const repository: LibraryRepository = {
      getLibraries,
      checkBookAvailability: async (): Promise<BookAvailability[]> => [],
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DependenciesProvider value={makeFakeDeps({ libraryRepository: repository })}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </DependenciesProvider>
    );

    const first = renderHook(() => usePrefectureLibraries('東京都'), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    const second = renderHook(() => usePrefectureLibraries('東京都'), { wrapper });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));

    expect(first.result.current.data).toEqual(libraries);
    expect(getLibraries).toHaveBeenCalledTimes(1);
    expect(getLibraries).toHaveBeenCalledWith({ pref: '東京都' });
  });
});
