import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Library } from '@/domain/models/library';
import { useDeps } from '@/app/dependencies';

export interface LibraryListParam {
  pref: string;
  city: string;
}

/**
 * 都道府県・市区町村に属する図書館一覧を取得する。
 *
 * `lib/presentation/providers/library_list_providers.dart` の移植。
 */
export function useLibraryList(
  param: LibraryListParam,
): UseQueryResult<Library[]> {
  const deps = useDeps();
  return useQuery({
    queryKey: ['libraries', param.pref, param.city],
    queryFn: () =>
      deps.libraryRepository.getLibraries({
        pref: param.pref,
        city: param.city,
      }),
  });
}
