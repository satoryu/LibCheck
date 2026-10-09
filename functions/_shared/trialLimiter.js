/**
 * 体験版（ログインなしの蔵書確認、#183）の利用上限を D1 で管理する。
 *
 * カーリル check の上限（appkey × IP ごとに 1000書籍リクエスト/時）は、サーバ
 * 経由のため全ユーザーで共有している前提で扱う。体験版の消費を時間バケット
 * ごとに数え、全体の上限で頭打ちにすることで、乱用されてもログインユーザーの
 * 枠を残す（docs/183-trial-availability-check/design.md）。
 *
 * Cloudflare の Rate Limiting binding は Pages Functions で使えず、拠点ごとの
 * 概算でもあるため、単一の一貫したカウンタとして D1 を使う。
 */

export const TRIAL_LIMITS = {
  /** 体験版全体で1時間に使ってよい書籍リクエスト数（ISBN 1件 × システム 1件 = 1）。 */
  globalBookRequestsPerHour: 300,
  /** 接続元（IP ハッシュ）ごとに1時間に実行できる体験回数。 */
  perIpChecksPerHour: 5,
  /** 1回の体験で問い合わせる図書館システムの上限。 */
  maxSystemsPerCheck: 5,
};

const HOUR_MS = 3600 * 1000;
/** これより古い時間バケットは削除する（IP ハッシュを2時間以上残さない）。 */
const RETAIN_HOURS = 2;

const INCREMENT_SQL =
  'INSERT INTO trial_usage (bucket, hour, count) VALUES (?, ?, ?) ' +
  'ON CONFLICT(bucket, hour) DO UPDATE SET count = count + excluded.count ' +
  'RETURNING count';

/**
 * 接続元の回数を1、全体の書籍リクエスト数を `bookRequests` だけ加算し、上限内かを返す。
 *
 * 接続元の上限を先に確かめ、超えていれば全体の枠は消費しない。加算と判定は
 * `INSERT … ON CONFLICT … RETURNING` で原子的に行う（超過した分のわずかな加算は許容）。
 *
 * @returns {Promise<{ok: true} | {ok: false, reason: 'ip' | 'global', retryAfterSeconds: number}>}
 */
export async function consumeTrialQuota(db, { ipHash, bookRequests, now, limits = TRIAL_LIMITS }) {
  const hour = Math.floor(now / HOUR_MS);
  const retryAfterSeconds = Math.ceil(((hour + 1) * HOUR_MS - now) / 1000);

  const [, ipResult] = await db.batch([
    db.prepare('DELETE FROM trial_usage WHERE hour < ?').bind(hour - RETAIN_HOURS + 1),
    db.prepare(INCREMENT_SQL).bind(`ip:${ipHash}`, hour, 1),
  ]);
  if (countOf(ipResult) > limits.perIpChecksPerHour) {
    return { ok: false, reason: 'ip', retryAfterSeconds };
  }

  const globalResult = await db.prepare(INCREMENT_SQL).bind('global', hour, bookRequests).all();
  if (countOf(globalResult) > limits.globalBookRequestsPerHour) {
    return { ok: false, reason: 'global', retryAfterSeconds };
  }
  return { ok: true };
}

function countOf(result) {
  return Number(result?.results?.[0]?.count ?? 0);
}
