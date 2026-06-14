import type { BookMetadata } from '@/domain/models/bookMetadata';
import type { BookMetadataRepository } from '@/domain/repositories/bookMetadataRepository';
import type { OpenBdApiClient } from '@/data/datasources/openBdApiClient';

/**
 * OpenBD を情報源とする `BookMetadataRepository` の実装。
 */
export class BookMetadataRepositoryImpl implements BookMetadataRepository {
  constructor(private readonly apiClient: OpenBdApiClient) {}

  async getByIsbn(isbn: string): Promise<BookMetadata | null> {
    const response = await this.apiClient.getByIsbn(isbn);
    if (response === null) {
      return null;
    }
    const summary = response.summary;
    return {
      isbn,
      title: summary?.title,
      author: summary?.author,
      publisher: summary?.publisher,
      coverImageUrl: summary?.cover,
    };
  }
}
