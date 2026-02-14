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

    test('should create an instance with required fields', () {
      expect(entry.isbn, '9784003101018');
      expect(entry.searchedAt, DateTime(2026, 2, 15, 10, 30));
      expect(entry.libraryStatuses, {
        'Tokyo_Chiyoda': 'available',
        'Tokyo_Shibuya': 'checkedOut',
      });
    });

    group('toJson', () {
      test('should convert to JSON map', () {
        final json = entry.toJson();

        expect(json['isbn'], '9784003101018');
        expect(json['searchedAt'], '2026-02-15T10:30:00.000');
        expect(json['libraryStatuses'], {
          'Tokyo_Chiyoda': 'available',
          'Tokyo_Shibuya': 'checkedOut',
        });
      });
    });

    group('fromJson', () {
      test('should create instance from JSON map', () {
        final json = {
          'isbn': '9784003101018',
          'searchedAt': '2026-02-15T10:30:00.000',
          'libraryStatuses': {
            'Tokyo_Chiyoda': 'available',
            'Tokyo_Shibuya': 'checkedOut',
          },
        };

        final result = SearchHistoryEntry.fromJson(json);

        expect(result.isbn, '9784003101018');
        expect(result.searchedAt, DateTime(2026, 2, 15, 10, 30));
        expect(result.libraryStatuses, {
          'Tokyo_Chiyoda': 'available',
          'Tokyo_Shibuya': 'checkedOut',
        });
      });

      test('should handle empty libraryStatuses', () {
        final json = {
          'isbn': '9784003101018',
          'searchedAt': '2026-02-15T10:30:00.000',
          'libraryStatuses': <String, dynamic>{},
        };

        final result = SearchHistoryEntry.fromJson(json);
        expect(result.libraryStatuses, isEmpty);
      });
    });

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

      test('should not be equal when isbn differs', () {
        final entry1 = SearchHistoryEntry(
          isbn: '9784003101018',
          searchedAt: DateTime(2026, 2, 15),
          libraryStatuses: {},
        );
        final entry2 = SearchHistoryEntry(
          isbn: '9784167158057',
          searchedAt: DateTime(2026, 2, 15),
          libraryStatuses: {},
        );

        expect(entry1, isNot(equals(entry2)));
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
