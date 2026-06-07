import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { BookAvailability } from '@/domain/models/bookAvailability';
import { useDeps } from '@/app/dependencies';

/**
 * 登録図書館における ISBN の蔵書状況を取得する。
 *
 * 登録図書館が無い場合は空配列を返す。
 * `lib/presentation/providers/book_availability_providers.dart` の移植。
 */
export function useBookAvailability(
  isbn: string,
): UseQueryResult<BookAvailability[]> {
  const deps = useDeps();
  return useQuery({
    queryKey: ['bookAvailability', isbn],
    enabled: isbn.length > 0,
    queryFn: async () => {
      const libraries = await deps.registeredLibraryRepository.getAll();
      const systemIds = Array.from(new Set(libraries.map((l) => l.systemId)));
      if (systemIds.length === 0) {
        return [];
      }
      return deps.libraryRepository.checkBookAvailability({
        isbn: [isbn],
        systemIds,
      });
    },
  });
}
