import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Library } from '@/domain/models/library';
import { useDeps } from '@/app/dependencies';

/**
 * 都道府県の図書館を全件取得する（#182）。
 *
 * 市区町村ページは「その市区町村の図書館」だけでなく、館数や同じ都道府県の
 * 他の市区町村も表示するため、都道府県単位で1回だけ取得して各ページで
 * 絞り込む（都道府県ページと市区町村ページでキャッシュを共有する）。
 * 静的JSON（`public/data/libraries/{pref}.json`）を読むため、カーリル API の
 * 利用制限は消費しない（#158）。データはデプロイ時にしか変わらないため
 * staleTime: Infinity（ページ間の移動で再取得しない）。
 */
export function usePrefectureLibraries(pref: string): UseQueryResult<Library[]> {
  const deps = useDeps();
  return useQuery({
    queryKey: ['prefectureLibraries', pref],
    queryFn: () => deps.libraryRepository.getLibraries({ pref }),
    staleTime: Infinity,
  });
}
