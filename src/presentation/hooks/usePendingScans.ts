import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { PendingScan } from '@/domain/models/pendingScan';
import { useDeps } from '@/app/dependencies';

export const PENDING_SCANS_KEY = ['pendingScans'] as const;

/**
 * 保留スキャン一覧（#144）。読取順（scannedAt 昇順）。
 *
 * networkMode 'always': このクエリは端末ローカル（localStorage）しか読まないが、
 * React Query の既定 'online' はオフライン中のフェッチを一時停止するため、
 * 肝心のオフライン時にカードが表示できなくなる。
 */
export function usePendingScans(): UseQueryResult<PendingScan[]> {
  const deps = useDeps();
  return useQuery({
    queryKey: PENDING_SCANS_KEY,
    networkMode: 'always',
    queryFn: () => deps.pendingScanRepository.getAll(),
  });
}

export interface PendingScanMutations {
  add(scan: PendingScan): Promise<PendingScan[]>;
  remove(isbn: string): Promise<PendingScan[]>;
}

/**
 * 保留スキャンの追加・削除。リポジトリが返す「更新後リスト」でキャッシュを
 * 直接更新する（useSearchHistoryMutations と同型。#100 P2-6 の契約）。
 *
 * networkMode 'always': 保留キューへの追加はまさにオフライン中に行われる操作
 * であり、既定の 'online' ではミューテーションが一時停止して保存も通知も
 * 行われない（オンライン復帰までスキャンが失われたように見える）。
 */
export function usePendingScanMutations(): PendingScanMutations {
  const deps = useDeps();
  const queryClient = useQueryClient();

  const updateCache = (updated: PendingScan[]): void => {
    queryClient.setQueryData(PENDING_SCANS_KEY, updated);
  };

  const addMutation = useMutation({
    networkMode: 'always',
    mutationFn: (scan: PendingScan) => deps.pendingScanRepository.add(scan),
    onSuccess: updateCache,
  });
  const removeMutation = useMutation({
    networkMode: 'always',
    mutationFn: (isbn: string) => deps.pendingScanRepository.remove(isbn),
    onSuccess: updateCache,
  });

  return {
    add: addMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
  };
}
