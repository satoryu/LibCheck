/**
 * 検索履歴の1エントリ。
 *
 * `libraryStatuses` は `{libraryKey: enumName}` の形式で保存される。
 * Key は登録分館ごとに一意な libraryKey、Value は AvailabilityStatus の
 * enum 名（"available", "checkedOut" 等）。集約表示では Value のみを使う。
 */
export interface SearchHistoryEntry {
  isbn: string;
  searchedAt: Date;
  /** 登録分館（libraryKey）ごとの蔵書状態。Value は AvailabilityStatus の enum 名文字列。 */
  libraryStatuses: Record<string, string>;
}

export function searchHistoryEntryFromJson(
  json: Record<string, unknown>,
): SearchHistoryEntry {
  const isbn = json['isbn'];
  if (typeof isbn !== 'string') {
    throw new Error('SearchHistoryEntry.fromJson: missing or invalid "isbn"');
  }
  const searchedAt = json['searchedAt'];
  if (typeof searchedAt !== 'string') {
    throw new Error(
      'SearchHistoryEntry.fromJson: missing or invalid "searchedAt"',
    );
  }
  const rawStatuses = json['libraryStatuses'];
  const libraryStatuses: Record<string, string> = {};
  if (rawStatuses && typeof rawStatuses === 'object') {
    for (const [key, value] of Object.entries(
      rawStatuses as Record<string, unknown>,
    )) {
      libraryStatuses[key] = String(value);
    }
  }
  return {
    isbn,
    searchedAt: new Date(searchedAt),
    libraryStatuses,
  };
}

export function searchHistoryEntryToJson(
  e: SearchHistoryEntry,
): Record<string, unknown> {
  return {
    isbn: e.isbn,
    searchedAt: e.searchedAt.toISOString(),
    libraryStatuses: e.libraryStatuses,
  };
}

export function searchHistoryEntriesEqual(
  a: SearchHistoryEntry,
  b: SearchHistoryEntry,
): boolean {
  return a.isbn === b.isbn;
}
