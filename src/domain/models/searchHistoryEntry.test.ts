import { describe, expect, test } from 'vitest';

import {
  SearchHistoryEntry,
  searchHistoryEntriesEqual,
  searchHistoryEntryFromJson,
  searchHistoryEntryToJson,
} from '@/domain/models/searchHistoryEntry';

describe('SearchHistoryEntry', () => {
  const entry: SearchHistoryEntry = {
    isbn: '9784003101018',
    searchedAt: new Date(2026, 1, 15, 10, 30),
    libraryStatuses: {
      Tokyo_Chiyoda: 'available',
      Tokyo_Shibuya: 'checkedOut',
    },
  };

  describe('equality', () => {
    test('should be equal when isbn matches', () => {
      const entry1: SearchHistoryEntry = {
        isbn: '9784003101018',
        searchedAt: new Date(2026, 1, 15),
        libraryStatuses: { Tokyo_Chiyoda: 'available' },
      };
      const entry2: SearchHistoryEntry = {
        isbn: '9784003101018',
        searchedAt: new Date(2026, 1, 16),
        libraryStatuses: { Tokyo_Shibuya: 'checkedOut' },
      };

      expect(searchHistoryEntriesEqual(entry1, entry2)).toBe(true);
    });
  });

  describe('roundtrip', () => {
    test('should survive JSON roundtrip', () => {
      const json = searchHistoryEntryToJson(entry);
      const restored = searchHistoryEntryFromJson(
        json as Record<string, unknown>,
      );

      expect(restored.isbn).toBe(entry.isbn);
      expect(restored.searchedAt.getTime()).toBe(entry.searchedAt.getTime());
      expect(restored.libraryStatuses).toEqual(entry.libraryStatuses);
    });
  });
});
