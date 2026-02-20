import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/models/book_availability.dart';
import 'package:libcheck/domain/repositories/library_repository.dart';
import 'package:libcheck/presentation/providers/city_providers.dart';
import 'package:libcheck/presentation/providers/library_providers.dart';

class MockLibraryRepository implements LibraryRepository {
  final List<Library> _libraries;

  MockLibraryRepository(this._libraries);

  @override
  Future<List<Library>> getLibraries({
    required String pref,
    String? city,
  }) async {
    return _libraries.where((lib) => lib.pref == pref).toList();
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
  String systemId = 'system1',
  String libKey = 'key1',
  String libId = 'id1',
}) {
  return Library(
    systemId: systemId,
    systemName: 'テスト図書館システム',
    libKey: libKey,
    libId: libId,
    shortName: 'テスト図書館',
    formalName: 'テスト図書館',
    address: '$pref$city',
    pref: pref,
    city: city,
    category: 'MEDIUM',
  );
}

void main() {
  group('cityListProvider', () {
    test('returns unique sorted city names from libraries', () async {
      final libraries = [
        _createLibrary(pref: '東京都', city: '港区', libId: '1'),
        _createLibrary(pref: '東京都', city: '千代田区', libId: '2'),
        _createLibrary(pref: '東京都', city: '港区', libId: '3'),
        _createLibrary(pref: '東京都', city: '新宿区', libId: '4'),
      ];

      final container = ProviderContainer(
        overrides: [
          libraryRepositoryProvider
              .overrideWithValue(MockLibraryRepository(libraries)),
        ],
      );
      addTearDown(container.dispose);

      final cities = await container.read(cityListProvider('東京都').future);
      expect(cities, ['千代田区', '新宿区', '港区']);
    });

  });
}
