import { isbnValidator } from '@/domain/utils/isbnValidator';

/**
 * ISBN から Amazon 関連の URL を導出する純粋関数群。
 *
 * 書影URL・商品ページURLは ISBN-10(=書籍のASIN) から同期的に導出できるため、
 * OpenBD 等のネットワーク取得に依存せず常に提示できる（グレースフルデグラデーション）。
 */

/**
 * Amazon 商品ページの URL を返す。
 *
 * ISBN-10 が導出できれば `/dp/{ISBN-10}`、できない（979始まり等）場合は
 * ISBN 文字列での検索 URL にフォールバックする。
 *
 * `associateTag` を渡すと Amazon アソシエイト（アフィリエイト）タグ `tag=` を
 * 付与する。空・未指定なら通常リンクを返す（ローカル開発では未指定＝通常リンク）。
 */
export function amazonProductUrl(isbn: string, associateTag?: string): string {
  const tag = associateTag?.trim();
  const isbn10 = isbnValidator.isbn13to10(isbn);
  if (isbn10 !== null) {
    const base = `https://www.amazon.co.jp/dp/${isbn10}`;
    return tag ? `${base}?tag=${encodeURIComponent(tag)}` : base;
  }
  const normalized = isbnValidator.normalizeIsbn(isbn);
  const base = `https://www.amazon.co.jp/s?k=${encodeURIComponent(normalized)}`;
  return tag ? `${base}&tag=${encodeURIComponent(tag)}` : base;
}

/**
 * Amazon 画像CDN の書影URLを返す。ISBN-10 が導出できなければ null。
 *
 * `09` は日本ロケールの画像サーバコード、`LZZZZZZZ` は大サイズ指定。
 * 書影が存在しない場合 Amazon は 1x1 のグレー画像を返す点に注意（表示側で対応）。
 */
export function amazonCoverImageUrl(isbn: string): string | null {
  const isbn10 = isbnValidator.isbn13to10(isbn);
  if (isbn10 === null) return null;
  return `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.09.LZZZZZZZ.jpg`;
}
