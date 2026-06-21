import type { SearchHistoryEntry } from '@/domain/models/searchHistoryEntry';
import type { SearchHistoryRepository } from '@/domain/repositories/searchHistoryRepository';
import type { SearchHistoryApiClient } from '@/data/datasources/searchHistoryApiClient';
import { getAuthToken } from '@/data/datasources/authTokenStore';

/**
 * 検索履歴をサーバー（D1）に永続化する実装。
 * 既存 `SearchHistoryRepository` の契約を保ち、save/remove は
 * 「現在リスト取得 → 変更 → 全置換 PUT」で実現する。
 */
export class ServerSearchHistoryRepositoryImpl
  implements SearchHistoryRepository
{
  constructor(
    private readonly apiClient: SearchHistoryApiClient,
    private readonly tokenProvider: () => string | null = getAuthToken,
  ) {}

  private token(): string {
    const token = this.tokenProvider();
    if (token === null || token.length === 0) {
      throw new Error('Not authenticated');
    }
    return token;
  }

  async getAll(): Promise<SearchHistoryEntry[]> {
    return this.apiClient.getAll(this.token());
  }

  async save(entry: SearchHistoryEntry): Promise<void> {
    const current = await this.getAll();
    // 同一 ISBN は置き換え、最新を先頭に。
    const next = [entry, ...current.filter((e) => e.isbn !== entry.isbn)];
    await this.apiClient.saveAll(this.token(), next);
  }

  async remove(isbn: string): Promise<void> {
    const current = await this.getAll();
    await this.apiClient.saveAll(
      this.token(),
      current.filter((e) => e.isbn !== isbn),
    );
  }

  async removeAll(): Promise<void> {
    await this.apiClient.saveAll(this.token(), []);
  }
}
