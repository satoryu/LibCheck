import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/data/repositories/registered_library_repository_impl.dart';
import 'package:libcheck/domain/models/library.dart';
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
  late RegisteredLibraryRepositoryImpl repository;

  const library1 = Library(
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

  const library2 = Library(
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

  setUp(() {
    fakeStorage = FakeLocalStorageRepository();
    repository = RegisteredLibraryRepositoryImpl(fakeStorage);
  });

  group('RegisteredLibraryRepositoryImpl', () {
    test('getAll returns empty list when no data stored', () async {
      final result = await repository.getAll();
      expect(result, isEmpty);
    });

    test('getAll returns stored libraries', () async {
      final jsonList = [library1.toJson(), library2.toJson()];
      await fakeStorage.setString(
        'registered_libraries',
        jsonEncode(jsonList),
      );

      final result = await repository.getAll();
      expect(result, hasLength(2));
      expect(result[0].systemId, 'Tokyo_Minato');
      expect(result[1].systemId, 'Tokyo_Shibuya');
    });

    test('add stores a library', () async {
      await repository.add(library1);

      final result = await repository.getAll();
      expect(result, hasLength(1));
      expect(result[0], equals(library1));
    });

    test('add does not duplicate existing library', () async {
      await repository.add(library1);
      await repository.add(library1);

      final result = await repository.getAll();
      expect(result, hasLength(1));
    });

    test('addAll stores multiple libraries', () async {
      await repository.addAll([library1, library2]);

      final result = await repository.getAll();
      expect(result, hasLength(2));
    });

    test('addAll skips duplicates', () async {
      await repository.add(library1);
      await repository.addAll([library1, library2]);

      final result = await repository.getAll();
      expect(result, hasLength(2));
    });

    test('remove deletes a library', () async {
      await repository.addAll([library1, library2]);
      await repository.remove(library1);

      final result = await repository.getAll();
      expect(result, hasLength(1));
      expect(result[0], equals(library2));
    });

    test('remove does nothing when library not found', () async {
      await repository.add(library1);
      await repository.remove(library2);

      final result = await repository.getAll();
      expect(result, hasLength(1));
    });

    test('saveAll replaces all libraries', () async {
      await repository.addAll([library1, library2]);
      await repository.saveAll([library2]);

      final result = await repository.getAll();
      expect(result, hasLength(1));
      expect(result[0], equals(library2));
    });
  });
}
