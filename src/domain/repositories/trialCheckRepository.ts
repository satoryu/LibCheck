import type { TrialCheckResult } from '@/domain/models/trialCheckResult';

/**
 * ログインなしの体験版（#183）。地域ページの市区町村の図書館で、ISBN 1件の
 * 貸出・予約の可否を調べる。上限に達した場合は `TrialRateLimitedError` を投げる。
 */
export interface TrialCheckRepository {
  check(args: { isbn: string; pref: string; city: string }): Promise<TrialCheckResult>;
}
