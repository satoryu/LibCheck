import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Library } from '@/domain/models/library';
import { useDeps } from '@/app/dependencies';
import { isKnownPrefecture } from '@/presentation/regionPage/regionPageContent';

/**
 * 都道府県の図書館を全件取得する（#182）。
 *
 * 市区町村ページは「その市区町村の図書館」だけでなく、館数や同じ都道府県の
 * 他の市区町村も表示するため、都道府県単位で1回だけ取得して各ページで
 * 絞り込む（都道府県ページと市区町村ページでキャッシュを共有する）。
 * 静的JSON（`public/data/libraries/{pref}.json`）を読むため、カーリル API の
 * 利用制限は消費しない（#158）。データはデプロイ時にしか変わらないため
 * staleTime: Infinity（ページ間の移動で再取得しない）。
 *
 * 未知の都道府県は取得しない（SPA フォールバックで index.html が返り JSON の
 * 解析に失敗するため）。空配列を返し、配信 HTML と同じく「見つかりません」と
 * 表示させる。
 */
export function usePrefectureLibraries(pref: string): UseQueryResult<Library[]> {
  const deps = useDeps();
  return useQuery({
    queryKey: ['prefectureLibraries', pref],
    queryFn: async () =>
      isKnownPrefecture(pref) ? deps.libraryRepository.getLibraries({ pref }) : [],
    staleTime: Infinity,
  });
}
