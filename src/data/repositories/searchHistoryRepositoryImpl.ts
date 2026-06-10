import {
  type SearchHistoryEntry,
  searchHistoryEntryFromJson,
  searchHistoryEntryToJson,
} from '@/domain/models/searchHistoryEntry';
import type { LocalStorageRepository } from '@/domain/repositories/localStorageRepository';
import type { SearchHistoryRepository } from '@/domain/repositories/searchHistoryRepository';

const STORAGE_KEY = 'search_history';
const MAX_ENTRIES = 100;

export class SearchHistoryRepositoryImpl implements SearchHistoryRepository {
  private readonly localStorage: LocalStorageRepository;

  constructor(localStorage: LocalStorageRepository) {
    this.localStorage = localStorage;
  }

  async getAll(): Promise<SearchHistoryEntry[]> {
    const entries = await this.getAllRaw();
    entries.sort((a, b) => b.searchedAt.getTime() - a.searchedAt.getTime());
    return entries;
  }

  async save(entry: SearchHistoryEntry): Promise<void> {
    const entries = await this.getAllRaw();

    const filtered = entries.filter((e) => e.isbn !== entry.isbn);
    filtered.push(entry);

    filtered.sort((a, b) => b.searchedAt.getTime() - a.searchedAt.getTime());

    const trimmed =
      filtered.length > MAX_ENTRIES
        ? filtered.slice(0, MAX_ENTRIES)
        : filtered;

    await this.saveAll(trimmed);
  }

  async remove(isbn: string): Promise<void> {
    const entries = await this.getAllRaw();
    const filtered = entries.filter((e) => e.isbn !== isbn);
    await this.saveAll(filtered);
  }

  async removeAll(): Promise<void> {
    await this.localStorage.remove(STORAGE_KEY);
  }

  private async getAllRaw(): Promise<SearchHistoryEntry[]> {
    const jsonString = await this.localStorage.getString(STORAGE_KEY);
    if (jsonString === null) return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return [];
    }
    if (!Array.isArray(parsed)) return [];

    // 壊れた1エントリで全履歴を失わないよう、エントリ単位で変換を試み、
    // 失敗したものだけスキップする（全体を破棄すると次の save で全消失する）。
    const entries: SearchHistoryEntry[] = [];
    for (const e of parsed) {
      try {
        entries.push(searchHistoryEntryFromJson(e as Record<string, unknown>));
      } catch {
        // 破損エントリはスキップ。
      }
    }
    return entries;
  }

  private async saveAll(entries: SearchHistoryEntry[]): Promise<void> {
    const jsonList = entries.map((e) => searchHistoryEntryToJson(e));
    await this.localStorage.setString(STORAGE_KEY, JSON.stringify(jsonList));
  }
}
