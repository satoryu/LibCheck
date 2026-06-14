/**
 * 書籍の書誌メタデータ。
 *
 * OpenBD から取得できる項目のみを保持する。書影URL・購入リンクは ISBN から
 * 純粋に導出できるためこのモデルには含めない（`@/domain/utils/amazonUrls` 参照）。
 * `coverImageUrl` は OpenBD 提供の書影で、Amazon 書影が取得できない場合の
 * フォールバックとして用いる。
 */
export interface BookMetadata {
  readonly isbn: string;
  readonly title?: string;
  readonly author?: string;
  readonly publisher?: string;
  readonly coverImageUrl?: string;
}
