import { QueryClient } from "@tanstack/react-query";

/**
 * クエリの再試行ポリシー（#100 P2-7）。
 *
 * - 再試行は最大1回（瞬断・5xx の UX 改善）。
 * - `HTTP 4xx` は再試行しない。特に 401 はセッション失効（#91）であり、
 *   再試行しても成功しない。
 * 保護 API のエラーは `protectedRequest` が `HTTP <status>` 形式で投げる。
 */
export function shouldRetryQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (failureCount >= 1) return false;
  if (error instanceof Error && /^HTTP 4\d\d$/.test(error.message)) {
    return false;
  }
  return true;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 登録図書館・検索履歴はユーザー操作でしか変わらないため、短時間の
        // 再取得は不要（別端末からの変更は stale 後の再フォーカス取得で拾う）。
        staleTime: 2 * 60 * 1000,
        retry: shouldRetryQuery,
      },
    },
  });
}
