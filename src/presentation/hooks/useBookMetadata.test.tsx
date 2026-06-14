import React from 'react';
import { describe, expect, test } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { DependenciesProvider, type AppDependencies } from '@/app/dependencies';
import { makeFakeDeps, FakeBookMetadataRepository } from '@/test/testUtils';
import { useBookMetadata } from '@/presentation/hooks/useBookMetadata';

function createWrapper(deps: AppDependencies) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
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

describe('useBookMetadata', () => {
  test('リポジトリから書籍メタデータを取得する', async () => {
    const deps = makeFakeDeps({
      bookMetadataRepository: new FakeBookMetadataRepository({
        '9784873117584': {
          isbn: '9784873117584',
          title: 'リーダブルコード',
          author: 'Dustin Boswell',
        },
      }),
    });

    const { result } = renderHook(() => useBookMetadata('9784873117584'), {
      wrapper: createWrapper(deps),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('リーダブルコード');
  });

  test('ISBN が空のときは取得しない', () => {
    const deps = makeFakeDeps();

    const { result } = renderHook(() => useBookMetadata(''), {
      wrapper: createWrapper(deps),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});
