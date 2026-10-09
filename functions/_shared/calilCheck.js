/**
 * カーリル check をサーバ側でポーリングまで完結させる（体験版 #183 用）。
 *
 * ログインユーザー向けの `/api/calil/check` はポーリングをブラウザに任せているが、
 * 体験版はクライアントに `session` を渡さず最終結果だけを返す（ポーリングを悪用した
 * 問い合わせや、任意の図書館システムの指定をさせないため）。
 *
 * 仕様書（https://calil.jp/doc/api_ref.html）どおり、ポーリングは2秒以上の間隔で、
 * `continue` が 0 になるまで続ける。ポーリングは書籍リクエストを消費しない。
 */
import { checkResponseFromJson } from '../../src/data/models/checkResponse.ts';

const CALIL_CHECK_URL = 'https://api.calil.jp/check';
const POLLING_INTERVAL_MS = 2000;
/**
 * 最大ポーリング回数（2秒 × 15 = 約30秒で打ち切る）。初回は図書館システムの
 * 応答が遅く20秒では終わらないことがあった（野洲市で実測）。ログインユーザー向けの
 * クライアント側ポーリング（最大60秒）より短くし、待ち時間を抑える。
 */
const MAX_POLLS = 15;
/** 1回の HTTP 問い合わせのタイムアウト。 */
const REQUEST_TIMEOUT_MS = 10_000;

/** カーリルへの問い合わせ自体が失敗した（HTTP エラー・通信エラー・形式不正）。 */
export class CalilUpstreamError extends Error {}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @returns {Promise<{response: import('../../src/data/models/checkResponse.ts').CheckResponse, complete: boolean}>}
 *   `complete: false` は最大回数で打ち切った（一部の図書館が確認中のまま）。
 */
export async function checkWithPolling({
  fetchFn,
  appKey,
  isbn,
  systemIds,
  sleep = defaultSleep,
  maxPolls = MAX_POLLS,
}) {
  let response = await request(fetchFn, {
    appkey: appKey,
    isbn,
    systemid: systemIds.join(','),
  });

  let polls = 0;
  while (response.continueFlag === 1 && polls < maxPolls) {
    await sleep(POLLING_INTERVAL_MS);
    polls++;
    response = await request(fetchFn, { appkey: appKey, session: response.session });
  }
  return { response, complete: response.continueFlag !== 1 };
}

async function request(fetchFn, params) {
  const url = new URL(CALIL_CHECK_URL);
  for (const [key, value] of Object.entries({ ...params, format: 'json', callback: 'no' })) {
    url.searchParams.set(key, value);
  }

  let res;
  try {
    res = await fetchFn(url.toString(), {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw new CalilUpstreamError(`カーリルへの接続に失敗しました: ${err}`);
  }
  if (res.status !== 200) {
    throw new CalilUpstreamError(`カーリルが HTTP ${res.status} を返しました`);
  }
  let body;
  try {
    body = await res.json();
  } catch {
    throw new CalilUpstreamError('カーリルの応答が JSON ではありません');
  }
  return checkResponseFromJson(body);
}
