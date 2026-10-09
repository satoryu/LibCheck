import { useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

import { useDeps } from '@/app/dependencies';
import type { TrialCheckResult } from '@/domain/models/trialCheckResult';

/**
 * ログインなしの体験版（#183）。地域ページの市区町村の図書館で ISBN 1件を調べる。
 *
 * サーバ側で上限を管理しており、失敗時の自動再試行は上限を余計に消費するため
 * 行わない（`useMutation` は既定で再試行しない）。
 */
export function useTrialCheck(
  pref: string,
  city: string,
): UseMutationResult<TrialCheckResult, Error, string> {
  const deps = useDeps();
  return useMutation({
    mutationFn: (isbn: string) => deps.trialCheckRepository.check({ isbn, pref, city }),
  });
}
