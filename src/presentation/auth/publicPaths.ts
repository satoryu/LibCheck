/**
 * 未ログインでも描画してよいルートのパスパターン一覧（#157）。
 *
 * #157 の時点では意図的に空。#158（地域ページ公開）・#159（ISBN検索結果
 * ページの部分公開）が、実際にルートを公開する際にここへパターンを
 * 追加する。追加した場合は `functions/_shared/routeMeta.js` の対応する
 * エントリも同時に更新すること（メタ情報側は独立管理。design.md 参照）。
 */
export const PUBLIC_PATHS: readonly string[] = [];

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
