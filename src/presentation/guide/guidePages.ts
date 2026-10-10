/**
 * 使い方ガイド（#184）の一覧。本文は静的ページ `public/guide/{slug}.html`。
 *
 * トップ・市区町村ページからのリンクを、配信 HTML（functions/_shared/regionPageHtml.js）と
 * SPA の両方でここから作る。Functions からも import するため `@/` エイリアスは使わない。
 * ページを足したら `public/guide/` に HTML を追加すること（sitemap は HTML の
 * ファイル一覧から生成され、テストで一覧とファイルの一致を確認している）。
 */

export interface GuidePage {
  slug: string;
  /** ページの h1 と同じ。リンクの文言にも使う。 */
  title: string;
  /** リンクに添える一言。 */
  summary: string;
}

export const GUIDE_PAGES: readonly GuidePage[] = [
  {
    slug: 'bookstore',
    title: '本屋で見つけた本が、図書館で借りられるか調べる',
    summary: '買う前に、近くの図書館にあるかをその場で確かめる',
  },
  {
    slug: 'barcode',
    title: '本のバーコードを読むだけで、図書館の予約可否を確認する',
    summary: '読み取り方と、結果の見方',
  },
  {
    slug: 'nearby-libraries',
    title: '近くの図書館をまとめて登録して、一度に確認する',
    summary: '自宅と職場の近くなど、複数の図書館をまとめて調べる',
  },
];

/**
 * ガイドへのリンク先。拡張子なしの URL は本番の Pages にしか存在せずローカルの
 * Vite では 404 になるため `.html` 付きにする（本番は 308 で拡張子なしへ転送）。
 */
export function guideHref(slug: string): string {
  return `/guide/${slug}.html`;
}
