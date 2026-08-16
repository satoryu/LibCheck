/**
 * パスパターン → メタ情報（#157）。
 *
 * `src/app/router.tsx` のルート定義に対応するが、Pages Functions は src/ の
 * React コンポーネントを import できない（別ビルド・別ランタイム）ため
 * 独立して持つ。**ルートを追加・変更したら router.tsx と両方を更新すること**
 * （詳細は docs/157-seo-foundation/design.md）。
 *
 * `/` はここに含めない＝エントリなし。ランディングページは #151 で作り込んだ
 * index.html 既定のメタ情報（indexable）をそのまま使うため、ミドルウェア側で
 * 明示的に「無変更」として扱う。
 *
 * 現時点ではどのルートも実際には未ログインで公開していない（#157 のスコープ
 * 外。#158・#159 が個別に公開する）ため、全エントリが `noindex: true`。
 */
export const ROUTE_META = [
  { pattern: '/library', title: '登録図書館 — LibCheck', noindex: true },
  { pattern: '/history', title: '検索履歴 — LibCheck', noindex: true },
  { pattern: '/library/add', title: '図書館を追加 — LibCheck', noindex: true },
  { pattern: '/library/add/:pref', title: '図書館を追加 — LibCheck', noindex: true },
  {
    pattern: '/library/add/:pref/:city',
    title: '図書館を追加 — LibCheck',
    noindex: true,
  },
  { pattern: '/scan', title: 'バーコードスキャン — LibCheck', noindex: true },
  { pattern: '/isbn-input', title: 'ISBN入力 — LibCheck', noindex: true },
  { pattern: '/result/:isbn', title: '検索結果 — LibCheck', noindex: true },
];

/**
 * `pathname` に一致する `ROUTE_META` のエントリを返す。無ければ `null`。
 *
 * パターンは `:` で始まるセグメントをワイルドカードとして扱う（1セグメント
 * のみに一致し、階層をまたがない）。それ以外のセグメントは完全一致が必要。
 */
export function findRouteMeta(pathname) {
  const found = ROUTE_META.find((entry) => matchesPattern(pathname, entry.pattern));
  return found ?? null;
}

function matchesPattern(pathname, pattern) {
  const pathSegments = splitPath(pathname);
  const patternSegments = splitPath(pattern);

  if (pathSegments.length !== patternSegments.length) return false;

  return patternSegments.every((patternSegment, i) => {
    if (patternSegment.startsWith(':')) return true;
    return patternSegment === pathSegments[i];
  });
}

function splitPath(path) {
  return path.split('/').filter((segment) => segment.length > 0);
}
