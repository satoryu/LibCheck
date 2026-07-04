import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { BookAvailability } from '@/domain/models/bookAvailability';
import { useDeps } from '@/app/dependencies';
import { useRegisteredLibraries } from '@/presentation/hooks/useRegisteredLibraries';

/**
 * 登録図書館における ISBN の蔵書状況を取得する。
 *
 * 登録図書館は `useRegisteredLibraries` の React Query キャッシュを共有する
 * （#100 P2-5。以前は queryFn 内でリポジトリを直接再取得しており、サーバ実装では
 * 検索のたびに余分な HTTP が発生していた）。queryKey に systemIds を含めるため、
 * 登録図書館の構成が変われば別エントリとして再取得される。
 * 登録図書館が無い場合は空配列を返す。
 */
export function useBookAvailability(
  isbn: string,
): UseQueryResult<BookAvailability[]> {
  const deps = useDeps();
  const registered = useRegisteredLibraries();

  // キーの安定化のため重複排除＋ソート（登録順の違いで別キャッシュにしない）。
  const systemIds = useMemo(
    () =>
      Array.from(
        new Set((registered.data ?? []).map((l) => l.systemId)),
      ).sort(),
    [registered.data],
  );

  return useQuery({
    queryKey: ['bookAvailability', isbn, systemIds],
    enabled: isbn.length > 0 && registered.isSuccess,
    // 蔵書検索は Calil のポーリング（最大60秒）を伴うため、グローバル既定の
    // 再試行（#100 P2-7）から除外する（失敗時の自動再実行は負荷増幅になる）。
    retry: false,
    queryFn: async () => {
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
