/**
 * 共有された検索結果ページ（/result/:isbn）の OGP 用に、書名と書影を OpenBD から取得する（#159）。
 *
 * OpenBD の利用規約は「本の販促・紹介目的に限り使用できる」「キャッシュは可、変更は
 * できるだけ早く反映」（https://openbd.jp/）。共有された本の紹介に当たるため利用し、
 * ISBN ごとに1日だけエッジでキャッシュする。取得は短いタイムアウトで打ち切り、
 * 失敗してもページの配信を妨げない（呼び出し側は既定のメタ情報で配信する）。
 */

const OPENBD_GET_URL = 'https://api.openbd.jp/v1/get';
const TIMEOUT_MS = 3000;
const CACHE_TTL_SECONDS = 86400;
/** キャッシュのキー（実在しない URL。Cache API は Request をキーにする）。 */
const CACHE_KEY_BASE = 'https://libcheck.app/__book-meta';

/** OGP / title に使う文言（2026-10-11 決定）。サイト名を含むため末尾の「— LibCheck」は付けない。 */
export function bookOgTitle(title) {
  return `『${title}』が図書館で借りられるか、LibCheckで確認`;
}

export function bookOgDescription(title) {
  return `『${title}』が近くの図書館で借りられるか・予約できるかを、本のバーコードを読み取るだけで調べられます。`;
}

/**
 * @returns {Promise<{title: string, coverUrl: string | null} | null>} 該当なし・失敗は null
 */
export async function fetchBookMeta(isbn, { fetchFn, cache, waitUntil } = {}) {
  const cacheKey = new Request(`${CACHE_KEY_BASE}?isbn=${encodeURIComponent(isbn)}`);
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return (await hit.json()).meta;
  }

  let meta;
  try {
    const res = await fetchFn(`${OPENBD_GET_URL}?isbn=${encodeURIComponent(isbn)}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    meta = toMeta(await res.json());
  } catch {
    // 通信エラー・タイムアウト・JSON でない応答。キャッシュせず、次の問い合わせで取り直す。
    return null;
  }

  // 該当なし（null）もキャッシュし、同じ ISBN で OpenBD を何度も呼ばない。
  if (cache) {
    const stored = cache.put(
      cacheKey,
      new Response(JSON.stringify({ meta }), {
        headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${CACHE_TTL_SECONDS}` },
      }),
    );
    if (waitUntil) waitUntil(stored);
    else await stored;
  }
  return meta;
}

function toMeta(body) {
  const summary = Array.isArray(body) ? body[0]?.summary : undefined;
  const title = typeof summary?.title === 'string' ? summary.title.trim() : '';
  if (title.length === 0) return null;
  return { title, coverUrl: isHttpUrl(summary.cover) ? summary.cover : null };
}

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}
