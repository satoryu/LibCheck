import type { BookMetadata } from '@/domain/models/bookMetadata';

/**
 * 書籍メタデータ（タイトル・著者・書影など）を取得するリポジトリ。
 */
export interface BookMetadataRepository {
  /**
   * ISBN に対応する書誌メタデータを取得する。該当が無ければ null。
   */
  getByIsbn(isbn: string): Promise<BookMetadata | null>;
}
