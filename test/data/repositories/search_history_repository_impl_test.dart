import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/data/repositories/search_history_repository_impl.dart';
import 'package:libcheck/domain/models/search_history_entry.dart';
import 'package:libcheck/domain/repositories/local_storage_repository.dart';

class FakeLocalStorageRepository implements LocalStorageRepository {
  final Map<String, dynamic> _store = {};

  @override
  Future<String?> getString(String key) async => _store[key] as String?;

  @override
  Future<bool> setString(String key, String value) async {
    _store[key] = value;
    return true;
  }

  @override
  Future<List<String>?> getStringList(String key) async =>
      _store[key] as List<String>?;

  @override
  Future<bool> setStringList(String key, List<String> value) async {
    _store[key] = value;
    return true;
  }

  @override
  Future<bool> remove(String key) async {
    _store.remove(key);
    return true;
  }
}

void main() {
  late FakeLocalStorageRepository fakeStorage;
  late SearchHistoryRepositoryImpl repository;

  setUp(() {
    fakeStorage = FakeLocalStorageRepository();
    repository = SearchHistoryRepositoryImpl(fakeStorage);
  });

  SearchHistoryEntry createEntry({
    required String isbn,
    DateTime? searchedAt,
    Map<String, String>? libraryStatuses,
  }) {
    return SearchHistoryEntry(
      isbn: isbn,
      searchedAt: searchedAt ?? DateTime(2026, 2, 15, 10, 0),
      libraryStatuses: libraryStatuses ?? {'Tokyo_Chiyoda': 'available'},
    );
  }

  group('SearchHistoryRepositoryImpl', () {
    group('getAll', () {
      test('returns empty list when no data stored', () async {
        final result = await repository.getAll();
        expect(result, isEmpty);
      });

      test('returns entries sorted by searchedAt descending', () async {
        final older = createEntry(
          isbn: '9784003101018',
          searchedAt: DateTime(2026, 2, 14),
        );
        final newer = createEntry(
          isbn: '9784167158057',
          searchedAt: DateTime(2026, 2, 15),
        );

        await repository.save(older);
        await repository.save(newer);

        final result = await repository.getAll();
        expect(result, hasLength(2));
        expect(result[0].isbn, '9784167158057');
        expect(result[1].isbn, '9784003101018');
      });

      test('returns empty list when stored JSON is corrupted', () async {
        await fakeStorage.setString('search_history', 'not valid json');
        final result = await repository.getAll();
        expect(result, isEmpty);
      });
    });

    group('save', () {
      test('saves a new entry', () async {
        final entry = createEntry(isbn: '9784003101018');
        await repository.save(entry);

        final result = await repository.getAll();
        expect(result, hasLength(1));
        expect(result[0].isbn, '9784003101018');
      });

      test('updates existing entry with same ISBN', () async {
        final original = createEntry(
          isbn: '9784003101018',
          searchedAt: DateTime(2026, 2, 14),
          libraryStatuses: {'Tokyo_Chiyoda': 'checkedOut'},
        );
        final updated = createEntry(
          isbn: '9784003101018',
          searchedAt: DateTime(2026, 2, 15),
          libraryStatuses: {'Tokyo_Chiyoda': 'available'},
        );

        await repository.save(original);
        await repository.save(updated);

        final result = await repository.getAll();
        expect(result, hasLength(1));
        expect(result[0].searchedAt, DateTime(2026, 2, 15));
        expect(result[0].libraryStatuses['Tokyo_Chiyoda'], 'available');
      });

      test('limits entries to maxEntries (100)', () async {
        for (var i = 0; i < 105; i++) {
          final isbn = '978400310${i.toString().padLeft(4, '0')}';
          await repository.save(createEntry(
            isbn: isbn,
            searchedAt: DateTime(2026, 1, 1).add(Duration(hours: i)),
          ));
        }

        final result = await repository.getAll();
        expect(result, hasLength(100));
      });

      test('removes oldest entries when exceeding maxEntries', () async {
        for (var i = 0; i < 105; i++) {
          final isbn = '978400310${i.toString().padLeft(4, '0')}';
          await repository.save(createEntry(
            isbn: isbn,
            searchedAt: DateTime(2026, 1, 1).add(Duration(hours: i)),
          ));
        }

        final result = await repository.getAll();
        // The first 5 entries (oldest) should have been removed
        expect(result.last.isbn, '978400310${5.toString().padLeft(4, '0')}');
      });
    });

    group('remove', () {
      test('removes entry by ISBN', () async {
        await repository.save(createEntry(isbn: '9784003101018'));
        await repository.save(createEntry(isbn: '9784167158057'));

        await repository.remove('9784003101018');

        final result = await repository.getAll();
        expect(result, hasLength(1));
        expect(result[0].isbn, '9784167158057');
      });

      test('does nothing when ISBN not found', () async {
        await repository.save(createEntry(isbn: '9784003101018'));
        await repository.remove('9784167158057');

        final result = await repository.getAll();
        expect(result, hasLength(1));
      });
    });

    group('removeAll', () {
      test('removes all entries', () async {
        await repository.save(createEntry(isbn: '9784003101018'));
        await repository.save(createEntry(isbn: '9784167158057'));

        await repository.removeAll();

        final result = await repository.getAll();
        expect(result, isEmpty);
      });
    });
  });
}
