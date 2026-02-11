import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/book_availability.dart';
import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/repositories/library_repository.dart';
import 'package:libcheck/presentation/providers/library_list_providers.dart';
import 'package:libcheck/presentation/providers/library_providers.dart';

class MockLibraryRepository implements LibraryRepository {
  final List<Library> _libraries;

  MockLibraryRepository(this._libraries);

  @override
  Future<List<Library>> getLibraries({
    required String pref,
    String? city,
  }) async {
    return _libraries
        .where((lib) => lib.pref == pref && (city == null || lib.city == city))
        .toList();
  }

  @override
  Future<List<BookAvailability>> checkBookAvailability({
    required List<String> isbn,
    required List<String> systemIds,
  }) async {
    return [];
  }
}

Library _createLibrary({
  required String pref,
  required String city,
  required String formalName,
  required String address,
  String systemId = 'system1',
  String libKey = 'key1',
  String libId = 'id1',
}) {
  return Library(
    systemId: systemId,
    systemName: 'テスト図書館システム',
    libKey: libKey,
    libId: libId,
    shortName: formalName,
    formalName: formalName,
    address: address,
    pref: pref,
    city: city,
    category: 'MEDIUM',
  );
}

void main() {
  group('LibraryListParam', () {
    test('two params with same pref and city are equal', () {
      const param1 = LibraryListParam(pref: '東京都', city: '港区');
      const param2 = LibraryListParam(pref: '東京都', city: '港区');
      expect(param1, equals(param2));
      expect(param1.hashCode, equals(param2.hashCode));
    });

    test('two params with different values are not equal', () {
      const param1 = LibraryListParam(pref: '東京都', city: '港区');
      const param2 = LibraryListParam(pref: '東京都', city: '新宿区');
      expect(param1, isNot(equals(param2)));
    });
  });

  group('libraryListProvider', () {
    test('returns libraries for the specified pref and city', () async {
      final libraries = [
        _createLibrary(
          pref: '東京都',
          city: '港区',
          formalName: '東京都立中央図書館',
          address: '東京都港区南麻布5-7-13',
          libId: '1',
        ),
        _createLibrary(
          pref: '東京都',
          city: '港区',
          formalName: '港区立みなと図書館',
          address: '東京都港区芝浦3-16-25',
          libId: '2',
        ),
        _createLibrary(
          pref: '東京都',
          city: '新宿区',
          formalName: '新宿区立中央図書館',
          address: '東京都新宿区大久保3-1-1',
          libId: '3',
        ),
      ];

      final container = ProviderContainer(
        overrides: [
          libraryRepositoryProvider
              .overrideWithValue(MockLibraryRepository(libraries)),
        ],
      );
      addTearDown(container.dispose);

      const param = LibraryListParam(pref: '東京都', city: '港区');
      final result = await container.read(libraryListProvider(param).future);

      expect(result.length, 2);
      expect(result[0].formalName, '東京都立中央図書館');
      expect(result[1].formalName, '港区立みなと図書館');
    });

    test('returns empty list when no libraries found', () async {
      final container = ProviderContainer(
        overrides: [
          libraryRepositoryProvider
              .overrideWithValue(MockLibraryRepository([])),
        ],
      );
      addTearDown(container.dispose);

      const param = LibraryListParam(pref: '東京都', city: '港区');
      final result = await container.read(libraryListProvider(param).future);

      expect(result, isEmpty);
    });
  });

  group('selectedLibrariesProvider', () {
    test('initial state is empty set', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final selected = container.read(selectedLibrariesProvider);
      expect(selected, isEmpty);
    });

    test('toggle adds a library', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final lib = _createLibrary(
        pref: '東京都',
        city: '港区',
        formalName: 'テスト図書館',
        address: '東京都港区',
      );

      container.read(selectedLibrariesProvider.notifier).toggle(lib);
      expect(container.read(selectedLibrariesProvider), {lib});
    });

    test('toggle removes an already selected library', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final lib = _createLibrary(
        pref: '東京都',
        city: '港区',
        formalName: 'テスト図書館',
        address: '東京都港区',
      );

      container.read(selectedLibrariesProvider.notifier).toggle(lib);
      container.read(selectedLibrariesProvider.notifier).toggle(lib);
      expect(container.read(selectedLibrariesProvider), isEmpty);
    });

    test('clear removes all selections', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final lib1 = _createLibrary(
        pref: '東京都',
        city: '港区',
        formalName: '図書館1',
        address: '東京都港区',
        libId: '1',
      );
      final lib2 = _createLibrary(
        pref: '東京都',
        city: '港区',
        formalName: '図書館2',
        address: '東京都港区',
        libId: '2',
      );

      container.read(selectedLibrariesProvider.notifier).toggle(lib1);
      container.read(selectedLibrariesProvider.notifier).toggle(lib2);
      expect(container.read(selectedLibrariesProvider).length, 2);

      container.read(selectedLibrariesProvider.notifier).clear();
      expect(container.read(selectedLibrariesProvider), isEmpty);
    });
  });
}
