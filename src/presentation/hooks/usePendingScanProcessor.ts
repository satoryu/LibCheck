import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { useDeps } from '@/app/dependencies';
import { availabilityToHistoryStatuses } from '@/presentation/utils/availabilityToHistoryStatuses';
import { useOnlineStatus } from '@/presentation/hooks/useOnlineStatus';
import {
  usePendingScans,
  usePendingScanMutations,
} from '@/presentation/hooks/usePendingScans';
import { useRegisteredLibraries } from '@/presentation/hooks/useRegisteredLibraries';
import { useSearchHistoryMutations } from '@/presentation/hooks/useSearchHistory';

/**
 * 保留スキャンの自動検索プロセッサ（#144）。AppShell から1箇所だけマウントする。
 *
 * オンラインかつ保留キューが空でなく登録図書館があるとき、キュー全 ISBN を
 * 1回の蔵書検索にまとめて実行する（Calil の /check はポーリング形式のため、
 * ISBN ごとにセッションを張ると負荷が件数倍になる）。成功した ISBN から順に
 * 検索履歴へ保存してキューから外し、最後にまとめて通知する。失敗時はキューを
 * 維持し、次のオンライン復帰・マウント時に再試行する。
 */
export function usePendingScanProcessor(): void {
  const deps = useDeps();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const pendingScans = usePendingScans();
  const { remove } = usePendingScanMutations();
  const registered = useRegisteredLibraries();
  const { save } = useSearchHistoryMutations();
  // online イベント連打や処理中のキュー更新による再発火で検索が多重実行
  // されないようにするガード。
  const isRunningRef = useRef(false);

  const scans = pendingScans.data;
  const libraries = registered.data;

  useEffect(() => {
    if (!isOnline) return;
    if (scans === undefined || scans.length === 0) return;
    if (libraries === undefined || libraries.length === 0) return;
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const run = async (): Promise<void> => {
      const isbns = scans.map((s) => s.isbn);
      // useBookAvailability と同じキー正規化（重複排除＋ソート）。
      const systemIds = Array.from(
        new Set(libraries.map((l) => l.systemId)),
      ).sort();
      const results = await deps.libraryRepository.checkBookAvailability({
        isbn: isbns,
        systemIds,
      });

      let completed = 0;
      for (const scan of scans) {
        const result = results.find((r) => r.isbn === scan.isbn);
        // 結果が返らなかった ISBN はキューに残す（次回再試行）。
        if (result === undefined) continue;
        await save({
          isbn: scan.isbn,
          searchedAt: new Date(),
          libraryStatuses: availabilityToHistoryStatuses(result, libraries),
        });
        // 履歴から結果画面を開いたときに再検索なしで表示できるようにする。
        queryClient.setQueryData(
          ['bookAvailability', scan.isbn, systemIds],
          [result],
        );
        await remove(scan.isbn);
        completed++;
      }
      if (completed > 0) {
        enqueueSnackbar(`保留していた${completed}件の検索が完了しました`, {
          variant: 'success',
        });
      }
    };

    run()
      .catch(() => {
        enqueueSnackbar(
          '保留中の検索を実行できませんでした。接続を確認して再度お試しください',
          { variant: 'warning' },
        );
      })
      .finally(() => {
        isRunningRef.current = false;
      });
    // save / remove は React Query の mutateAsync（安定参照）。
  }, [isOnline, scans, libraries, deps, queryClient, save, remove]);
}
