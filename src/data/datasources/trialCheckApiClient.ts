import { TrialRateLimitedError } from '@/domain/models/trialCheckResult';

/** `/api/trial/check` の応答（functions/api/trial/check.js）。 */
export interface TrialCheckResponse {
  isbn: string;
  complete: boolean;
  omittedLibraryCount: number;
  libraries: {
    name: string;
    systemId: string;
    libKey: string;
    libId: string;
    /** カーリルの館ごとの状態文字列（'貸出可' 等。蔵書なしは空文字）。 */
    status: string;
    /** カーリルの図書館システムの状態（'OK' / 'Cache' / 'Running' / 'Error'）。 */
    systemStatus: string;
    reserveUrl: string | null;
  }[];
}

export interface TrialCheckApiClientOptions {
  fetchFn?: typeof fetch;
  baseUrl?: string;
  /** サーバ側でポーリングするため最長約20秒かかる。余裕を持たせる。 */
  httpTimeoutMs?: number;
}

/** ログインなしの体験版 API（#183）。認証ヘッダは付けない。 */
export class TrialCheckApiClient {
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;
  private readonly httpTimeoutMs: number;

  constructor(options: TrialCheckApiClientOptions = {}) {
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.baseUrl = options.baseUrl ?? '/api/trial/check';
    this.httpTimeoutMs = options.httpTimeoutMs ?? 40_000;
  }

  async check(args: { isbn: string; pref: string; city: string }): Promise<TrialCheckResponse> {
    const res = await this.fetchFn(this.baseUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(this.httpTimeoutMs),
    });
    if (res.status === 429) {
      const body = (await res.json().catch(() => ({}))) as { reason?: unknown };
      const retryAfter = Number(res.headers.get('retry-after'));
      throw new TrialRateLimitedError(
        body.reason === 'ip' ? 'ip' : 'global',
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
      );
    }
    if (res.status !== 200) {
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as TrialCheckResponse;
  }
}
