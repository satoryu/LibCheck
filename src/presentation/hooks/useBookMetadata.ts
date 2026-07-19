import { useMemo } from 'react';
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
    // 補助情報のため、外部APIの障害時はリトライを最小限にして速やかに
    // フォールバック表示へ移行する（該当なしは null 解決で error ではない）。
    retry: 1,
  });
}

/**
 * 複数 ISBN の書籍メタデータを一括取得する（#141。検索履歴一覧用）。
 *
 * OpenBD の一括 API により何件でも1リクエストで解決する。書誌は不変データの
 * ため staleTime: Infinity。補助情報のため失敗は致命的に扱わないこと。
 */
export function useBookMetadataList(
  isbns: string[],
): UseQueryResult<Map<string, BookMetadata>> {
  const deps = useDeps();
  // キーの安定化（重複排除＋ソート。順序違いで別キャッシュにしない）。
  const key = useMemo(() => Array.from(new Set(isbns)).sort(), [isbns]);
  return useQuery({
    queryKey: ['bookMetadataList', key],
    enabled: key.length > 0,
    queryFn: () => deps.bookMetadataRepository.getByIsbns(key),
    staleTime: Infinity,
    retry: 1,
  });
}
