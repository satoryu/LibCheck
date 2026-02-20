import 'package:flutter_test/flutter_test.dart';
import 'package:libcheck/domain/models/search_history_entry.dart';

void main() {
  group('SearchHistoryEntry', () {
    final entry = SearchHistoryEntry(
      isbn: '9784003101018',
      searchedAt: DateTime(2026, 2, 15, 10, 30),
      libraryStatuses: {
        'Tokyo_Chiyoda': 'available',
        'Tokyo_Shibuya': 'checkedOut',
      },
    );

    group('equality', () {
      test('should be equal when isbn matches', () {
        final entry1 = SearchHistoryEntry(
          isbn: '9784003101018',
          searchedAt: DateTime(2026, 2, 15),
          libraryStatuses: {'Tokyo_Chiyoda': 'available'},
        );
        final entry2 = SearchHistoryEntry(
          isbn: '9784003101018',
          searchedAt: DateTime(2026, 2, 16),
          libraryStatuses: {'Tokyo_Shibuya': 'checkedOut'},
        );

        expect(entry1, equals(entry2));
        expect(entry1.hashCode, equals(entry2.hashCode));
      });
    });

    group('roundtrip', () {
      test('should survive JSON roundtrip', () {
        final json = entry.toJson();
        final restored = SearchHistoryEntry.fromJson(json);

        expect(restored.isbn, entry.isbn);
        expect(restored.searchedAt, entry.searchedAt);
        expect(restored.libraryStatuses, entry.libraryStatuses);
      });
    });
  });
}
