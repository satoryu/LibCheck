import type { SearchHistoryEntry } from '@/domain/models/searchHistoryEntry';
import { MAX_SEARCH_HISTORY_ENTRIES } from '@/domain/models/searchHistoryEntry';
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

  // 認証は HttpOnly セッション Cookie（#91）が主。リロード後はトークンが null でも
  // Cookie で認証されるため例外にしない（未認証は API の 401 として表面化）。
  private token(): string | null {
    return this.tokenProvider();
  }

  async getAll(): Promise<SearchHistoryEntry[]> {
    return this.apiClient.getAll(this.token());
  }

  async save(entry: SearchHistoryEntry): Promise<void> {
    const current = await this.getAll();
    // 同一 ISBN は置き換え、最新を先頭に。上限超過分は古いものから切り捨てる
    // （放置すると PUT の件数検証に達した時点で保存が失敗し続ける。#115）。
    const next = [entry, ...current.filter((e) => e.isbn !== entry.isbn)].slice(
      0,
      MAX_SEARCH_HISTORY_ENTRIES,
    );
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
