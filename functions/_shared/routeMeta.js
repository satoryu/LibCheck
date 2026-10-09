/**
 * パスパターン → メタ情報（#157、#158 で拡張）。
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
 * `title` / `description` は `(params) => string` の関数で持つ。動的
 * セグメント（`:pref` 等）を持たないエントリも `params` を無視するだけの
 * 関数として統一し、`findRouteMeta` の実装をシンプルに保つ。
 *
 * #158: `/library/add` 系3ルートを公開。#182 で、これらは `region`（地域ページの
 * 種別）だけを持つエントリに変えた（内容は図書館データからミドルウェアが組み立てる）。
 * それ以外は #157 のまま `noindex: true`。
 */
export const ROUTE_META = [
  {
    pattern: '/library',
    noindex: true,
    title: () => '登録図書館 — LibCheck',
    description: () => '',
  },
  {
    pattern: '/history',
    noindex: true,
    title: () => '検索履歴 — LibCheck',
    description: () => '',
  },
  // 地域ページ（#158 で公開）。title / description / 本文 / 構造化データは
  // 図書館データに依存するため、ここでは種別だけを持ち、ミドルウェアが
  // src/presentation/regionPage/regionPageContent.ts で組み立てる（#182）。
  { pattern: '/library/add', region: 'index' },
  { pattern: '/library/add/:pref', region: 'prefecture' },
  { pattern: '/library/add/:pref/:city', region: 'city' },
  {
    pattern: '/scan',
    noindex: true,
    title: () => 'バーコードスキャン — LibCheck',
    description: () => '',
  },
  {
    pattern: '/isbn-input',
    noindex: true,
    title: () => 'ISBN入力 — LibCheck',
    description: () => '',
  },
  {
    pattern: '/result/:isbn',
    noindex: true,
    title: () => '検索結果 — LibCheck',
    description: () => '',
  },
];

/**
 * `pathname` に一致する `ROUTE_META` のエントリを、動的セグメントの値を
 * 展開したメタ情報として返す。無ければ `null`。
 *
 * 地域ページは `{ region, params }`（`region` は 'index' | 'prefecture' | 'city'）、
 * それ以外は `{ noindex, title, description }` を返す。
 *
 * パターンは `:` で始まるセグメントをワイルドカードとして扱う（1セグメント
 * のみに一致し、階層をまたがない）。それ以外のセグメントは完全一致が必要。
 */
export function findRouteMeta(pathname) {
  for (const entry of ROUTE_META) {
    const params = matchPattern(pathname, entry.pattern);
    if (params === null) continue;
    if (entry.region !== undefined) {
      return { region: entry.region, params };
    }
    return {
      noindex: entry.noindex,
      title: entry.title(params),
      description: entry.description(params),
    };
  }
  return null;
}

/**
 * `pathname` が `pattern` にマッチすれば、動的セグメントの値（デコード済み）
 * を `{ pref: '東京都', city: '港区' }` のような形で返す。マッチしなければ
 * `null`。
 */
function matchPattern(pathname, pattern) {
  const pathSegments = splitPath(pathname);
  const patternSegments = splitPath(pattern);

  if (pathSegments.length !== patternSegments.length) return null;

  const params = {};
  for (let i = 0; i < patternSegments.length; i++) {
    const patternSegment = patternSegments[i];
    if (patternSegment.startsWith(':')) {
      try {
        params[patternSegment.slice(1)] = decodeURIComponent(pathSegments[i]);
      } catch {
        // 不正なパーセントエンコーディング（URIError）は未知のパスとして扱う。
        return null;
      }
    } else if (patternSegment !== pathSegments[i]) {
      return null;
    }
  }
  return params;
}

function splitPath(path) {
  return path.split('/').filter((segment) => segment.length > 0);
}
