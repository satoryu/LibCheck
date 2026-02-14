import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/availability_status.dart';
import 'package:libcheck/domain/models/book_availability.dart';
import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/models/library_status.dart';
import 'package:libcheck/domain/repositories/library_repository.dart';
import 'package:libcheck/domain/repositories/registered_library_repository.dart';
import 'package:libcheck/presentation/providers/book_availability_providers.dart';
import 'package:libcheck/presentation/providers/library_providers.dart';
import 'package:libcheck/presentation/providers/registered_library_providers.dart';

class FakeLibraryRepository implements LibraryRepository {
  final List<BookAvailability> _result;
  List<String>? capturedIsbn;
  List<String>? capturedSystemIds;

  FakeLibraryRepository([this._result = const []]);

  @override
  Future<List<Library>> getLibraries({
    required String pref,
    String? city,
  }) async {
    return [];
  }

  @override
  Future<List<BookAvailability>> checkBookAvailability({
    required List<String> isbn,
    required List<String> systemIds,
  }) async {
    capturedIsbn = isbn;
    capturedSystemIds = systemIds;
    return _result;
  }
}

class ErrorLibraryRepository implements LibraryRepository {
  @override
  Future<List<Library>> getLibraries({
    required String pref,
    String? city,
  }) async {
    return [];
  }

  @override
  Future<List<BookAvailability>> checkBookAvailability({
    required List<String> isbn,
    required List<String> systemIds,
  }) async {
    throw Exception('API error');
  }
}

class FakeRegisteredLibraryRepository implements RegisteredLibraryRepository {
  final List<Library> _libraries;

  FakeRegisteredLibraryRepository([this._libraries = const []]);

  @override
  Future<List<Library>> getAll() async => List.from(_libraries);

  @override
  Future<void> saveAll(List<Library> libraries) async {}

  @override
  Future<List<Library>> add(Library library) async => List.from(_libraries);

  @override
  Future<List<Library>> addAll(List<Library> libraries) async =>
      List.from(_libraries);

  @override
  Future<List<Library>> remove(Library library) async =>
      List.from(_libraries);
}

const _library1 = Library(
  systemId: 'Tokyo_Minato',
  systemName: '港区図書館',
  libKey: 'みなと',
  libId: '123',
  shortName: 'みなと図書館',
  formalName: '港区立みなと図書館',
  address: '東京都港区芝公園3-2-25',
  pref: '東京都',
  city: '港区',
  category: 'MEDIUM',
);

const _library2 = Library(
  systemId: 'Tokyo_Shibuya',
  systemName: '渋谷区図書館',
  libKey: 'しぶや',
  libId: '456',
  shortName: '渋谷図書館',
  formalName: '渋谷区立中央図書館',
  address: '東京都渋谷区神宮前1-1-1',
  pref: '東京都',
  city: '渋谷区',
  category: 'LARGE',
);

void main() {
  group('bookAvailabilityProvider', () {
    test('returns availability results for registered libraries', () async {
      final expectedResult = [
        BookAvailability(
          isbn: '9784123456789',
          libraryStatuses: {
            'Tokyo_Minato': const LibraryStatus(
              systemId: 'Tokyo_Minato',
              status: AvailabilityStatus.available,
              libKeyStatuses: {'みなと': '貸出可'},
            ),
          },
        ),
      ];

      final fakeLibraryRepo = FakeLibraryRepository(expectedResult);
      final fakeRegisteredRepo =
          FakeRegisteredLibraryRepository([_library1, _library2]);

      final container = ProviderContainer(
        overrides: [
          libraryRepositoryProvider.overrideWithValue(fakeLibraryRepo),
          registeredLibraryRepositoryProvider
              .overrideWithValue(fakeRegisteredRepo),
        ],
      );
      addTearDown(container.dispose);

      final result =
          await container.read(bookAvailabilityProvider('9784123456789').future);

      expect(result, hasLength(1));
      expect(result[0].isbn, '9784123456789');
      expect(fakeLibraryRepo.capturedIsbn, ['9784123456789']);
      expect(
        fakeLibraryRepo.capturedSystemIds,
        containsAll(['Tokyo_Minato', 'Tokyo_Shibuya']),
      );
    });

    test('returns empty list when no libraries registered', () async {
      final fakeLibraryRepo = FakeLibraryRepository();
      final fakeRegisteredRepo = FakeRegisteredLibraryRepository();

      final container = ProviderContainer(
        overrides: [
          libraryRepositoryProvider.overrideWithValue(fakeLibraryRepo),
          registeredLibraryRepositoryProvider
              .overrideWithValue(fakeRegisteredRepo),
        ],
      );
      addTearDown(container.dispose);

      final result =
          await container.read(bookAvailabilityProvider('9784123456789').future);

      expect(result, isEmpty);
      expect(fakeLibraryRepo.capturedIsbn, isNull);
    });

    test('deduplicates systemIds from registered libraries', () async {
      // Two libraries with the same systemId
      const lib1 = Library(
        systemId: 'Tokyo_Minato',
        systemName: '港区図書館',
        libKey: 'みなと',
        libId: '123',
        shortName: 'みなと図書館',
        formalName: 'みなと図書館',
        address: '住所1',
        pref: '東京都',
        city: '港区',
        category: 'MEDIUM',
      );
      const lib2 = Library(
        systemId: 'Tokyo_Minato',
        systemName: '港区図書館',
        libKey: '高輪',
        libId: '789',
        shortName: '高輪図書館',
        formalName: '高輪図書館',
        address: '住所2',
        pref: '東京都',
        city: '港区',
        category: 'SMALL',
      );

      final fakeLibraryRepo = FakeLibraryRepository();
      final fakeRegisteredRepo = FakeRegisteredLibraryRepository([lib1, lib2]);

      final container = ProviderContainer(
        overrides: [
          libraryRepositoryProvider.overrideWithValue(fakeLibraryRepo),
          registeredLibraryRepositoryProvider
              .overrideWithValue(fakeRegisteredRepo),
        ],
      );
      addTearDown(container.dispose);

      await container.read(bookAvailabilityProvider('9784123456789').future);

      expect(fakeLibraryRepo.capturedSystemIds, hasLength(1));
      expect(fakeLibraryRepo.capturedSystemIds, ['Tokyo_Minato']);
    });

    test('propagates errors from repository', () async {
      final errorRepo = ErrorLibraryRepository();
      final fakeRegisteredRepo =
          FakeRegisteredLibraryRepository([_library1]);

      final container = ProviderContainer(
        overrides: [
          libraryRepositoryProvider.overrideWithValue(errorRepo),
          registeredLibraryRepositoryProvider
              .overrideWithValue(fakeRegisteredRepo),
        ],
      );
      addTearDown(container.dispose);

      container.listen(bookAvailabilityProvider('9784123456789'), (_, _) {});

      // Wait for the provider to settle
      await Future.delayed(const Duration(milliseconds: 100));

      final state =
          container.read(bookAvailabilityProvider('9784123456789'));
      expect(state.hasError, isTrue);
    });
  });
}
