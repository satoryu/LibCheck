import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { SearchHistoryEntry } from '@/domain/models/searchHistoryEntry';
import { useDeps } from '@/app/dependencies';

const SEARCH_HISTORY_KEY = ['searchHistory'] as const;

/**
 * 検索履歴一覧を取得する。
 *
 * `lib/presentation/providers/search_history_providers.dart` の移植。
 */
export function useSearchHistory(): UseQueryResult<SearchHistoryEntry[]> {
  const deps = useDeps();
  return useQuery({
    queryKey: SEARCH_HISTORY_KEY,
    queryFn: () => deps.searchHistoryRepository.getAll(),
  });
}

export interface SearchHistoryMutations {
  save(entry: SearchHistoryEntry): Promise<void>;
  remove(isbn: string): Promise<void>;
  removeAll(): Promise<void>;
}

/**
 * 検索履歴の保存・削除を行い、`['searchHistory']` キャッシュを更新する。
 */
export function useSearchHistoryMutations(): SearchHistoryMutations {
  const deps = useDeps();
  const queryClient = useQueryClient();

  return {
    save: async (entry: SearchHistoryEntry) => {
      await deps.searchHistoryRepository.save(entry);
      const updated = await deps.searchHistoryRepository.getAll();
      queryClient.setQueryData(SEARCH_HISTORY_KEY, updated);
    },
    remove: async (isbn: string) => {
      await deps.searchHistoryRepository.remove(isbn);
      const updated = await deps.searchHistoryRepository.getAll();
      queryClient.setQueryData(SEARCH_HISTORY_KEY, updated);
    },
    removeAll: async () => {
      await deps.searchHistoryRepository.removeAll();
      queryClient.setQueryData(SEARCH_HISTORY_KEY, [] as SearchHistoryEntry[]);
    },
  };
}
