import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { useDeps } from '@/app/dependencies';

/**
 * 都道府県に属する市区町村一覧を取得する。
 *
 * `lib/presentation/providers/city_providers.dart` の移植。
 */
export function useCityList(pref: string): UseQueryResult<string[]> {
  const deps = useDeps();
  return useQuery({
    queryKey: ['cities', pref],
    queryFn: async () => {
      const libs = await deps.libraryRepository.getLibraries({ pref });
      return Array.from(new Set(libs.map((l) => l.city))).sort();
    },
  });
}
