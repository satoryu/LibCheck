import React from 'react';
import { describe, expect, test } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { DependenciesProvider, type AppDependencies } from '@/app/dependencies';
import { makeFakeDeps, FakeBookMetadataRepository } from '@/test/testUtils';
import { useBookMetadata, useBookMetadataList } from '@/presentation/hooks/useBookMetadata';

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

describe('useBookMetadataList（#141）', () => {
  test('複数 ISBN を一括取得で1回だけ問い合わせ、Map を返す', async () => {
    let callCount = 0;
    const repo = new FakeBookMetadataRepository({
      A: { isbn: 'A', title: 'タイトルA' },
      C: { isbn: 'C', title: 'タイトルC' },
    });
    const origin = repo.getByIsbns.bind(repo);
    repo.getByIsbns = async (isbns) => {
      callCount++;
      return origin(isbns);
    };
    const deps = makeFakeDeps({ bookMetadataRepository: repo });

    const { result } = renderHook(() => useBookMetadataList(['A', 'B', 'C']), {
      wrapper: createWrapper(deps),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(callCount).toBe(1);
    const map = result.current.data!;
    expect(map.get('A')?.title).toBe('タイトルA');
    expect(map.has('B')).toBe(false);
    expect(map.get('C')?.title).toBe('タイトルC');
  });

  test('空配列では問い合わせない', async () => {
    const repo = new FakeBookMetadataRepository();
    let called = false;
    repo.getByIsbns = async () => {
      called = true;
      return new Map();
    };
    const deps = makeFakeDeps({ bookMetadataRepository: repo });

    const { result } = renderHook(() => useBookMetadataList([]), {
      wrapper: createWrapper(deps),
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(called).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
  });
});
