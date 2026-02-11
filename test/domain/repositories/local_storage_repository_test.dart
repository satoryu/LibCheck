import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/repositories/local_storage_repository.dart';

class MockLocalStorageRepository implements LocalStorageRepository {
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
  group('LocalStorageRepository interface', () {
    late MockLocalStorageRepository repository;

    setUp(() {
      repository = MockLocalStorageRepository();
    });

    test('can be implemented and used for getString/setString', () async {
      expect(await repository.getString('key'), isNull);
      await repository.setString('key', 'value');
      expect(await repository.getString('key'), 'value');
    });

    test('can be implemented and used for getStringList/setStringList',
        () async {
      expect(await repository.getStringList('list'), isNull);
      await repository.setStringList('list', ['a', 'b', 'c']);
      expect(await repository.getStringList('list'), ['a', 'b', 'c']);
    });

    test('can be implemented and used for remove', () async {
      await repository.setString('key', 'value');
      expect(await repository.getString('key'), 'value');
      await repository.remove('key');
      expect(await repository.getString('key'), isNull);
    });
  });
}
