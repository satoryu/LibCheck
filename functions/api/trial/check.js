/**
 * 体験版: ログインなしで ISBN 1件の貸出・予約の可否を、地域ページの市区町村の
 * 図書館で調べる（#183）。`POST /api/trial/check`、本文は `{ isbn, pref, city }`。
 *
 * ログインユーザー向けの `/api/calil/*`（認証必須・#89）とは別のエンドポイントで、
 * カーリル check の共有上限を守るため次のように絞る
 * （docs/183-trial-availability-check/design.md）。
 *
 *  - 調べる図書館システムはクライアントに指定させず、静的データから市区町村の
 *    システムをサーバが選ぶ（公共優先・最大5システム）
 *  - 同じ ISBN × 同じシステムの結果は10分キャッシュし、上限を消費しない
 *  - D1 で接続元ごと（5回/時）と体験版全体（300書籍リクエスト/時）の上限を管理する。
 *    上限で止まるのは体験版だけで、ログインユーザーの枠は残る
 *  - ポーリングはサーバ側で完結させ、クライアントに `session` を渡さない
 *
 * 接続元 IP は `TRIAL_IP_SALT`（シークレット）付きの SHA-256 にしてから保存する。
 * `TRIAL_IP_SALT` が未設定なら、生の IP を扱わないよう体験版自体を止める（503）。
 */
import { checkWithPolling, CalilUpstreamError } from '../../_shared/calilCheck.js';
import { consumeTrialQuota, TRIAL_LIMITS } from '../../_shared/trialLimiter.js';
import { selectTrialSystems } from '../../_shared/trialTargets.js';
import { isbnValidator } from '../../../src/domain/utils/isbnValidator.ts';
import { isKnownPrefecture } from '../../../src/presentation/regionPage/regionPageContent.ts';

/** 体験版の結果キャッシュの有効期間（秒）。貸出状況は変わるため短くする。 */
const RESULT_CACHE_TTL = 600;
/** 本文の上限（ISBN・都道府県・市区町村だけなので十分小さい）。 */
const MAX_BODY_BYTES = 1024;

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.TRIAL_IP_SALT) {
    return json({ error: 'unavailable' }, 503);
  }
  if (!env.CALIL_APP_KEY) {
    return new Response('Server misconfigured: CALIL_APP_KEY is not set', { status: 500 });
  }

  const input = await parseInput(request);
  if (input === null) return json({ error: 'bad_request' }, 400);

  const cityLibraries = await loadCityLibraries(input, context);
  if (cityLibraries === null) return json({ error: 'unavailable' }, 503);
  if (cityLibraries.length === 0) return json({ error: 'bad_request' }, 400);

  const target = selectTrialSystems(cityLibraries, TRIAL_LIMITS.maxSystemsPerCheck);

  const cache = globalThis.caches?.default;
  const cacheKey = new Request(
    `https://libcheck.app/__trial-cache?isbn=${input.isbn}&systems=${encodeURIComponent(
      [...target.systemIds].sort().join(','),
    )}`,
  );
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) {
      const cached = await hit.json();
      return json(toResult(input.isbn, target, cached), 200, { 'x-trial-cache': 'hit' });
    }
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const quota = await consumeTrialQuota(env.DB, {
    ipHash: await sha256Hex(`${env.TRIAL_IP_SALT}:${ip}`),
    bookRequests: target.systemIds.length,
    now: Date.now(),
  });
  if (!quota.ok) {
    return json({ error: 'rate_limited', reason: quota.reason }, 429, {
      'retry-after': String(quota.retryAfterSeconds),
    });
  }

  let checked;
  try {
    checked = await checkWithPolling({
      fetchFn: globalThis.fetch,
      appKey: env.CALIL_APP_KEY,
      isbn: input.isbn,
      systemIds: target.systemIds,
    });
  } catch (err) {
    if (err instanceof CalilUpstreamError) return json({ error: 'upstream' }, 502);
    throw err;
  }

  const systems = checked.response.books[input.isbn] ?? {};
  const snapshot = { systems, complete: checked.complete };
  if (cache && checked.complete) {
    // 確認中の図書館が残る結果はキャッシュしない（次の問い合わせで完了させる）。
    context.waitUntil?.(
      cache.put(
        cacheKey,
        new Response(JSON.stringify(snapshot), {
          headers: { 'cache-control': `public, max-age=${RESULT_CACHE_TTL}` },
        }),
      ),
    );
  }
  return json(toResult(input.isbn, target, snapshot), 200);
}

/** 本文を検証し `{ isbn, pref, city }`（ISBN はハイフン除去済み）を返す。不正なら null。 */
async function parseInput(request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return null;
  }
  const { isbn, pref, city } = body ?? {};
  if (typeof isbn !== 'string' || typeof pref !== 'string' || typeof city !== 'string') {
    return null;
  }
  const normalized = isbn.replace(/[-\s]/g, '');
  if (!isbnValidator.isValidIsbn(normalized) || !isKnownPrefecture(pref)) return null;
  return { isbn: normalized, pref, city };
}

/** 市区町村の図書館（静的データ）。0館なら []、データを取得できなければ null。 */
async function loadCityLibraries({ pref, city }, { env, request }) {
  try {
    const res = await env.ASSETS.fetch(
      new URL(`/data/libraries/${encodeURIComponent(pref)}.json`, request.url),
    );
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !type.includes('json')) throw new Error(`HTTP ${res.status} (${type})`);
    const libraries = await res.json();
    return libraries.filter((library) => library.city === city);
  } catch (err) {
    console.error(`体験版: 図書館データの取得に失敗しました（${pref}）: ${err}`);
    return null;
  }
}

/** カーリルの結果を、市区町村の図書館ごとの状態に整形する。 */
function toResult(isbn, target, { systems, complete }) {
  return {
    isbn,
    complete,
    omittedLibraryCount: target.omittedLibraryCount,
    libraries: target.libraries.map((library) => {
      const system = systems[library.systemId];
      return {
        name: library.formalName.trim(),
        systemId: library.systemId,
        libKey: library.libKey,
        libId: library.libId,
        // 館の libkey が結果に無ければ蔵書なし（空文字）。システム自体の状態は別に返す。
        status: system?.libKeys?.[library.libKey] ?? '',
        systemStatus: system?.status ?? 'Running',
        reserveUrl: safeHttpUrl(system?.reserveUrl),
      };
    }),
  };
}

function safeHttpUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function json(body, status, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });
}
