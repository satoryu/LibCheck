import {
  type SearchHistoryEntry,
  searchHistoryEntryFromJson,
  searchHistoryEntryToJson,
} from '@/domain/models/searchHistoryEntry';
import { protectedRequest } from '@/data/datasources/protectedApi';

export interface SearchHistoryApiClientOptions {
  fetchFn?: typeof fetch;
  baseUrl?: string;
  httpTimeoutMs?: number;
}

/** `/api/search-history`（GET 一覧 / PUT 全置換）を叩くクライアント。 */
export class SearchHistoryApiClient {
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;
  private readonly httpTimeoutMs: number;

  constructor(options: SearchHistoryApiClientOptions = {}) {
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.baseUrl = options.baseUrl ?? '/api/search-history';
    this.httpTimeoutMs = options.httpTimeoutMs ?? 10000;
  }

  async getAll(token: string | null): Promise<SearchHistoryEntry[]> {
    const body = (await protectedRequest(
      this.fetchFn,
      this.baseUrl,
      'GET',
      token,
      undefined,
      this.httpTimeoutMs,
    )) as { entries?: unknown };
    return Array.isArray(body.entries)
      ? body.entries.map((e) =>
          searchHistoryEntryFromJson(e as Record<string, unknown>),
        )
      : [];
  }

  async saveAll(token: string | null, entries: SearchHistoryEntry[]): Promise<void> {
    await protectedRequest(
      this.fetchFn,
      this.baseUrl,
      'PUT',
      token,
      { entries: entries.map(searchHistoryEntryToJson) },
      this.httpTimeoutMs,
    );
  }
}
