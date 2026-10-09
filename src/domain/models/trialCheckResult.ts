import type { AvailabilityStatus } from '@/domain/models/availabilityStatus';

/**
 * ログインなしの体験版（#183）で調べた、1館ぶんの結果。
 */
export interface TrialLibraryResult {
  readonly name: string;
  readonly systemId: string;
  readonly libKey: string;
  readonly libId: string;
  readonly status: AvailabilityStatus;
  /** 図書館システムの確認がまだ終わっていない（ポーリングを打ち切った）。 */
  readonly checking: boolean;
  /** 予約ページの URL（http(s) のみ）。無ければ null。 */
  readonly reserveUrl: string | null;
}

export interface TrialCheckResult {
  readonly isbn: string;
  readonly libraries: readonly TrialLibraryResult[];
  /** 1回で調べる図書館システム数の上限により、対象外にした館の数。 */
  readonly omittedLibraryCount: number;
  /** すべての図書館システムの確認が終わったか。 */
  readonly complete: boolean;
}

/** 体験版の利用上限に達した（接続元ごと、または体験版全体）。 */
export class TrialRateLimitedError extends Error {
  constructor(
    readonly reason: 'ip' | 'global',
    readonly retryAfterSeconds: number | null,
  ) {
    super(`trial rate limited: ${reason}`);
    this.name = 'TrialRateLimitedError';
  }
}
