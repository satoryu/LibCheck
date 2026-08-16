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
 * #158: `/library/add` 系3ルートを公開（`noindex: false`）。都道府県名・
 * 市区町村名をタイトル・説明文に反映する。それ以外は #157 のまま
 * `noindex: true`（#159 が ISBN検索結果ページを公開する際に同様に更新する）。
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
  {
    pattern: '/library/add',
    noindex: false,
    title: () => '図書館を追加 — LibCheck',
    description: () =>
      '都道府県・市区町村から図書館を選んで登録できます。ログインすると、登録した図書館の蔵書をまとめて検索できます。',
  },
  {
    pattern: '/library/add/:pref',
    noindex: false,
    title: (p) => `${p.pref}の図書館一覧 — LibCheck`,
    description: (p) =>
      `${p.pref}の図書館一覧です。市区町村を選ぶと、その地域の図書館を確認できます。ログインすると登録して蔵書を検索できます。`,
  },
  {
    pattern: '/library/add/:pref/:city',
    noindex: false,
    title: (p) => `${p.pref}${p.city}の図書館 — LibCheck`,
    description: (p) =>
      `${p.pref}${p.city}にある図書館の一覧です。ログインすると、この地域の図書館を登録して蔵書を検索できます。`,
  },
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
 * パターンは `:` で始まるセグメントをワイルドカードとして扱う（1セグメント
 * のみに一致し、階層をまたがない）。それ以外のセグメントは完全一致が必要。
 */
export function findRouteMeta(pathname) {
  for (const entry of ROUTE_META) {
    const params = matchPattern(pathname, entry.pattern);
    if (params === null) continue;
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
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegments[i]);
    } else if (patternSegment !== pathSegments[i]) {
      return null;
    }
  }
  return params;
}

function splitPath(path) {
  return path.split('/').filter((segment) => segment.length > 0);
}
