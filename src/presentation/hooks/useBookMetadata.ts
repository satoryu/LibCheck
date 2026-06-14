import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { BookMetadata } from '@/domain/models/bookMetadata';
import { useDeps } from '@/app/dependencies';

/**
 * ISBN に対応する書籍メタデータ（タイトル・著者・書影など）を取得する。
 *
 * 書影・購入リンクは ISBN から導出できる補助情報であり、取得失敗は中核機能
 * （蔵書状況表示）に影響させない設計のため、本フックの error は呼び出し側で
 * 致命的に扱わないこと。
 */
export function useBookMetadata(
  isbn: string,
): UseQueryResult<BookMetadata | null> {
  const deps = useDeps();
  return useQuery({
    queryKey: ['bookMetadata', isbn],
    enabled: isbn.length > 0,
    queryFn: () => deps.bookMetadataRepository.getByIsbn(isbn),
  });
}
