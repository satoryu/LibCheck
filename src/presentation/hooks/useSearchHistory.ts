import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  save(entry: SearchHistoryEntry): Promise<SearchHistoryEntry[]>;
  remove(isbn: string): Promise<SearchHistoryEntry[]>;
  removeAll(): Promise<SearchHistoryEntry[]>;
}

/**
 * 検索履歴の保存・削除。リポジトリが返す「更新後リスト」でキャッシュを直接
 * 更新する（#100 P2-6。以前は操作後に再 getAll しており、サーバ実装では
 * 履歴保存1回につき余分な GET が発生していた）。
 * useMutation ベースなので失敗は呼び出し側の Promise に伝播する。
 */
export function useSearchHistoryMutations(): SearchHistoryMutations {
  const deps = useDeps();
  const queryClient = useQueryClient();

  const updateCache = (updated: SearchHistoryEntry[]): void => {
    queryClient.setQueryData(SEARCH_HISTORY_KEY, updated);
  };

  const saveMutation = useMutation({
    mutationFn: (entry: SearchHistoryEntry) =>
      deps.searchHistoryRepository.save(entry),
    onSuccess: updateCache,
  });
  const removeMutation = useMutation({
    mutationFn: (isbn: string) => deps.searchHistoryRepository.remove(isbn),
    onSuccess: updateCache,
  });
  const removeAllMutation = useMutation({
    mutationFn: () => deps.searchHistoryRepository.removeAll(),
    onSuccess: updateCache,
  });

  return {
    save: saveMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    removeAll: removeAllMutation.mutateAsync,
  };
}
