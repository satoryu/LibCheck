import { describe, expect, it, vi } from 'vitest';

import { AvailabilityStatus } from '@/domain/models/availabilityStatus';
import { TrialRateLimitedError } from '@/domain/models/trialCheckResult';
import { TrialCheckApiClient } from '@/data/datasources/trialCheckApiClient';
import { TrialCheckRepositoryImpl } from '@/data/repositories/trialCheckRepositoryImpl';

function repositoryWith(response: Response) {
  const fetchFn = vi.fn(async () => response);
  return { fetchFn, repository: new TrialCheckRepositoryImpl(new TrialCheckApiClient({ fetchFn })) };
}

const BODY = {
  isbn: '9784003101018',
  complete: false,
  omittedLibraryCount: 2,
  libraries: [
    { name: 'A館', systemId: 'S1', libKey: 'A', libId: '1', status: '貸出可', systemStatus: 'OK', reserveUrl: 'https://r.example/1' },
    { name: 'B館', systemId: 'S1', libKey: 'B', libId: '2', status: '', systemStatus: 'Cache', reserveUrl: null },
    { name: 'C館', systemId: 'S2', libKey: 'C', libId: '3', status: '', systemStatus: 'Error', reserveUrl: null },
    { name: 'D館', systemId: 'S3', libKey: 'D', libId: '4', status: '', systemStatus: 'Running', reserveUrl: null },
  ],
};

describe('TrialCheckRepositoryImpl', () => {
  it('POST /api/trial/check に isbn・pref・city を送る', async () => {
    const { fetchFn, repository } = repositoryWith(new Response(JSON.stringify(BODY), { status: 200 }));

    await repository.check({ isbn: '9784003101018', pref: '滋賀県', city: '野洲市' });

    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/trial/check');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ isbn: '9784003101018', pref: '滋賀県', city: '野洲市' });
  });

  it('館ごとの状態をドメインの AvailabilityStatus に変換する', async () => {
    const { repository } = repositoryWith(new Response(JSON.stringify(BODY), { status: 200 }));

    const result = await repository.check({ isbn: '9784003101018', pref: '滋賀県', city: '野洲市' });

    expect(result.complete).toBe(false);
    expect(result.omittedLibraryCount).toBe(2);
    expect(result.libraries.map((l) => [l.name, l.status, l.checking, l.reserveUrl])).toEqual([
      ['A館', AvailabilityStatus.available, false, 'https://r.example/1'],
      ['B館', AvailabilityStatus.notFound, false, null],
      // システムの検索自体が失敗したら「蔵書なし」ではなく error（既存の蔵書検索と同じ方針）。
      ['C館', AvailabilityStatus.error, false, null],
      // 確認が終わっていないシステムは checking。
      ['D館', AvailabilityStatus.unknown, true, null],
    ]);
  });

  it('429 は TrialRateLimitedError（理由と Retry-After 付き）', async () => {
    const { repository } = repositoryWith(
      new Response(JSON.stringify({ error: 'rate_limited', reason: 'global' }), {
        status: 429,
        headers: { 'retry-after': '1200' },
      }),
    );

    const error = await repository.check({ isbn: '9784003101018', pref: '滋賀県', city: '野洲市' }).catch((e) => e);

    expect(error).toBeInstanceOf(TrialRateLimitedError);
    expect(error).toMatchObject({ reason: 'global', retryAfterSeconds: 1200 });
  });

  it('その他のエラーは HTTP ステータス付きの Error', async () => {
    const { repository } = repositoryWith(new Response('x', { status: 502 }));

    await expect(repository.check({ isbn: '9784003101018', pref: '滋賀県', city: '野洲市' })).rejects.toThrow(
      'HTTP 502',
    );
  });
});
