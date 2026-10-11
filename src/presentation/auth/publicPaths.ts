/**
 * 未ログインでも描画してよいルートのパスパターン一覧（#157 で導入）。
 *
 * #158 で地域ページ（都道府県選択・市区町村選択・図書館一覧）を公開。
 * #159 で ISBN検索結果ページを部分公開（未ログインは書誌情報と案内のみ）。追加した場合は `functions/_shared/routeMeta.js` の対応する
 * エントリも同時に更新すること（メタ情報側は独立管理。design.md 参照）。
 */
export const PUBLIC_PATHS: readonly string[] = [
  '/library/add',
  '/library/add/:pref',
  '/library/add/:pref/:city',
  // #159: 共有された検索結果ページ。未ログインでは書誌情報と案内だけを表示する
  // （蔵書状況はログイン後のみ）。functions/_shared/routeMeta.js では noindex のまま。
  '/result/:isbn',
];

/**
 * `pathname` が `publicPaths`（既定は `PUBLIC_PATHS`）のいずれかのパターンに
 * マッチするかを判定する。
 *
 * パターンは `/library/add/:pref` のように `:` で始まるセグメントを
 * ワイルドカードとして扱う（1セグメント分のみに一致し、階層をまたがない）。
 * それ以外のセグメントは完全一致が必要（前方一致では true にならない）。
 */
export function isPublicPath(
  pathname: string,
  publicPaths: readonly string[] = PUBLIC_PATHS,
): boolean {
  return publicPaths.some((pattern) => matchesPattern(pathname, pattern));
}

function matchesPattern(pathname: string, pattern: string): boolean {
  const pathSegments = splitPath(pathname);
  const patternSegments = splitPath(pattern);

  if (pathSegments.length !== patternSegments.length) return false;

  return patternSegments.every((patternSegment, i) => {
    if (patternSegment.startsWith(':')) return true;
    return patternSegment === pathSegments[i];
  });
}

function splitPath(path: string): string[] {
  return path.split('/').filter((segment) => segment.length > 0);
}
