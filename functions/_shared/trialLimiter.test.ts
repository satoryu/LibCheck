// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { createSqliteD1 } from './testing/sqliteD1';
import { TRIAL_LIMITS, consumeTrialQuota } from './trialLimiter.js';

const HOUR = 3600 * 1000;
const NOW = 1_800_000_000_000; // 任意の時刻（ミリ秒）

function counts(db: ReturnType<typeof createSqliteD1>) {
  return db.raw.prepare('SELECT bucket, hour, count FROM trial_usage ORDER BY bucket, hour').all();
}

describe('consumeTrialQuota', () => {
  it('上限内なら ok で、接続元は回数・全体は書籍リクエスト数を加算する', async () => {
    const db = createSqliteD1();

    expect(await consumeTrialQuota(db, { ipHash: 'aaa', bookRequests: 3, now: NOW })).toEqual({ ok: true });
    expect(await consumeTrialQuota(db, { ipHash: 'aaa', bookRequests: 2, now: NOW })).toEqual({ ok: true });

    const hour = Math.floor(NOW / HOUR);
    expect(counts(db)).toEqual([
      { bucket: 'global', hour, count: 5 },
      { bucket: 'ip:aaa', hour, count: 2 },
    ]);
  });

  it('接続元の上限を超えたら reason: ip で、全体の枠は消費しない', async () => {
    const db = createSqliteD1();
    const limits = { ...TRIAL_LIMITS, perIpChecksPerHour: 2 };

    await consumeTrialQuota(db, { ipHash: 'aaa', bookRequests: 1, now: NOW, limits });
    await consumeTrialQuota(db, { ipHash: 'aaa', bookRequests: 1, now: NOW, limits });
    const third = await consumeTrialQuota(db, { ipHash: 'aaa', bookRequests: 1, now: NOW, limits });

    expect(third).toMatchObject({ ok: false, reason: 'ip' });
    const global = counts(db).find((r) => r.bucket === 'global');
    expect(global?.count).toBe(2);
    // 別の接続元は影響を受けない。
    expect(await consumeTrialQuota(db, { ipHash: 'bbb', bookRequests: 1, now: NOW, limits })).toEqual({ ok: true });
  });

  it('全体の上限を超えたら reason: global', async () => {
    const db = createSqliteD1();
    const limits = { ...TRIAL_LIMITS, globalBookRequestsPerHour: 5 };

    expect(await consumeTrialQuota(db, { ipHash: 'aaa', bookRequests: 3, now: NOW, limits })).toEqual({ ok: true });
    expect(await consumeTrialQuota(db, { ipHash: 'bbb', bookRequests: 3, now: NOW, limits })).toMatchObject({
      ok: false,
      reason: 'global',
    });
  });

  it('上限超過時は次の時間帯が始まるまでの秒数を返す', async () => {
    const db = createSqliteD1();
    const limits = { ...TRIAL_LIMITS, perIpChecksPerHour: 1 };
    const now = Math.floor(NOW / HOUR) * HOUR + 59 * 60 * 1000; // 時間帯の残り1分

    await consumeTrialQuota(db, { ipHash: 'aaa', bookRequests: 1, now, limits });
    expect(await consumeTrialQuota(db, { ipHash: 'aaa', bookRequests: 1, now, limits })).toEqual({
      ok: false,
      reason: 'ip',
      retryAfterSeconds: 60,
    });
  });

  it('時間帯が変われば数え直し、2時間より古い行は削除する', async () => {
    const db = createSqliteD1();
    const limits = { ...TRIAL_LIMITS, perIpChecksPerHour: 1 };

    await consumeTrialQuota(db, { ipHash: 'aaa', bookRequests: 1, now: NOW, limits });
    expect(await consumeTrialQuota(db, { ipHash: 'aaa', bookRequests: 1, now: NOW + HOUR, limits })).toEqual({ ok: true });

    await consumeTrialQuota(db, { ipHash: 'ccc', bookRequests: 1, now: NOW + 3 * HOUR, limits });
    const hours = new Set(counts(db).map((r) => r.hour));
    expect(hours.has(Math.floor(NOW / HOUR))).toBe(false);
  });
});
