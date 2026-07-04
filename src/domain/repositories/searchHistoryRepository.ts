import { SearchHistoryEntry } from '@/domain/models/searchHistoryEntry';

export interface SearchHistoryRepository {
  /** 全履歴（新しい順）。 */
  getAll(): Promise<SearchHistoryEntry[]>;
  /** 保存し、更新後の全履歴（新しい順）を返す（#100 P2-6: 再取得を不要にする契約）。 */
  save(entry: SearchHistoryEntry): Promise<SearchHistoryEntry[]>;
  /** 削除し、更新後の全履歴（新しい順）を返す。 */
  remove(isbn: string): Promise<SearchHistoryEntry[]>;
  /** 全削除し、空リストを返す。 */
  removeAll(): Promise<SearchHistoryEntry[]>;
}
