import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/search_history_entry.dart';
import 'package:libcheck/domain/repositories/search_history_repository.dart';
import 'package:libcheck/presentation/providers/search_history_providers.dart';

class FakeSearchHistoryRepository implements SearchHistoryRepository {
  List<SearchHistoryEntry> _entries = [];

  @override
  Future<List<SearchHistoryEntry>> getAll() async {
    final sorted = List<SearchHistoryEntry>.from(_entries);
    sorted.sort((a, b) => b.searchedAt.compareTo(a.searchedAt));
    return sorted;
  }

  @override
  Future<void> save(SearchHistoryEntry entry) async {
    _entries.removeWhere((e) => e.isbn == entry.isbn);
    _entries.add(entry);
  }

  @override
  Future<void> remove(String isbn) async {
    _entries.removeWhere((e) => e.isbn == isbn);
  }

  @override
  Future<void> removeAll() async {
    _entries = [];
  }
}

void main() {
  late FakeSearchHistoryRepository fakeRepo;
  late ProviderContainer container;

  setUp(() {
    fakeRepo = FakeSearchHistoryRepository();
    container = ProviderContainer(
      overrides: [
        searchHistoryRepositoryProvider.overrideWithValue(fakeRepo),
      ],
    );
  });

  tearDown(() => container.dispose());

  group('searchHistoryProvider', () {
    test('initial state loads from repository', () async {
      await fakeRepo.save(SearchHistoryEntry(
        isbn: '9784003101018',
        searchedAt: DateTime(2026, 2, 15),
        libraryStatuses: {'Tokyo_Chiyoda': 'available'},
      ));

      container.listen(searchHistoryProvider, (_, _) {});
      final result = await container.read(searchHistoryProvider.future);

      expect(result, hasLength(1));
      expect(result[0].isbn, '9784003101018');
    });

    test('initial state is empty when repository is empty', () async {
      container.listen(searchHistoryProvider, (_, _) {});
      final result = await container.read(searchHistoryProvider.future);

      expect(result, isEmpty);
    });

    test('save adds entry and updates state', () async {
      container.listen(searchHistoryProvider, (_, _) {});
      await container.read(searchHistoryProvider.future);

      await container.read(searchHistoryProvider.notifier).save(
            SearchHistoryEntry(
              isbn: '9784003101018',
              searchedAt: DateTime(2026, 2, 15),
              libraryStatuses: {'Tokyo_Chiyoda': 'available'},
            ),
          );

      final result = await container.read(searchHistoryProvider.future);
      expect(result, hasLength(1));
      expect(result[0].isbn, '9784003101018');
    });

    test('remove deletes entry and updates state', () async {
      await fakeRepo.save(SearchHistoryEntry(
        isbn: '9784003101018',
        searchedAt: DateTime(2026, 2, 15),
        libraryStatuses: {},
      ));
      await fakeRepo.save(SearchHistoryEntry(
        isbn: '9784167158057',
        searchedAt: DateTime(2026, 2, 14),
        libraryStatuses: {},
      ));

      container.listen(searchHistoryProvider, (_, _) {});
      await container.read(searchHistoryProvider.future);

      await container
          .read(searchHistoryProvider.notifier)
          .remove('9784003101018');

      final result = await container.read(searchHistoryProvider.future);
      expect(result, hasLength(1));
      expect(result[0].isbn, '9784167158057');
    });

    test('removeAll clears all entries and updates state', () async {
      await fakeRepo.save(SearchHistoryEntry(
        isbn: '9784003101018',
        searchedAt: DateTime(2026, 2, 15),
        libraryStatuses: {},
      ));

      container.listen(searchHistoryProvider, (_, _) {});
      await container.read(searchHistoryProvider.future);

      await container.read(searchHistoryProvider.notifier).removeAll();

      final result = await container.read(searchHistoryProvider.future);
      expect(result, isEmpty);
    });
  });
}
