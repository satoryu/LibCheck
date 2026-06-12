import { SearchHistoryEntry } from '@/domain/models/searchHistoryEntry';

export interface SearchHistoryRepository {
  getAll(): Promise<SearchHistoryEntry[]>;
  save(entry: SearchHistoryEntry): Promise<void>;
  remove(isbn: string): Promise<void>;
  removeAll(): Promise<void>;
}
