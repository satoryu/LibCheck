import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Library } from '@/domain/models/library';
import { useDeps } from '@/app/dependencies';

const REGISTERED_LIBRARIES_KEY = ['registeredLibraries'] as const;

/**
 * 登録図書館一覧を取得する。
 *
 * `lib/presentation/providers/registered_library_providers.dart` の移植。
 */
export function useRegisteredLibraries(): UseQueryResult<Library[]> {
  const deps = useDeps();
  return useQuery({
    queryKey: REGISTERED_LIBRARIES_KEY,
    queryFn: () => deps.registeredLibraryRepository.getAll(),
  });
}

export interface RegisteredLibraryMutations {
  add(library: Library): Promise<Library[]>;
  addAll(libraries: Library[]): Promise<Library[]>;
  remove(library: Library): Promise<Library[]>;
}

/**
 * 登録図書館の追加・削除を行い、`['registeredLibraries']` キャッシュを更新する。
 */
export function useRegisteredLibraryMutations(): RegisteredLibraryMutations {
  const deps = useDeps();
  const queryClient = useQueryClient();

  return {
    add: async (library: Library) => {
      const updated = await deps.registeredLibraryRepository.add(library);
      queryClient.setQueryData(REGISTERED_LIBRARIES_KEY, updated);
      return updated;
    },
    addAll: async (libraries: Library[]) => {
      const updated = await deps.registeredLibraryRepository.addAll(libraries);
      queryClient.setQueryData(REGISTERED_LIBRARIES_KEY, updated);
      return updated;
    },
    remove: async (library: Library) => {
      const updated = await deps.registeredLibraryRepository.remove(library);
      queryClient.setQueryData(REGISTERED_LIBRARIES_KEY, updated);
      return updated;
    },
  };
}
