import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:libcheck/data/repositories/shared_preferences_local_storage_repository.dart';
import 'package:libcheck/domain/repositories/local_storage_repository.dart';

void main() {
  group('SharedPreferencesLocalStorageRepository', () {
    late SharedPreferencesLocalStorageRepository repository;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      repository = SharedPreferencesLocalStorageRepository(prefs);
    });

    test('implements LocalStorageRepository', () {
      expect(repository, isA<LocalStorageRepository>());
    });

    group('getString / setString', () {
      test('returns null for non-existent key', () async {
        expect(await repository.getString('nonexistent'), isNull);
      });

      test('stores and retrieves a string value', () async {
        final result = await repository.setString('key', 'hello');
        expect(result, isTrue);
        expect(await repository.getString('key'), 'hello');
      });

      test('overwrites an existing value', () async {
        await repository.setString('key', 'first');
        await repository.setString('key', 'second');
        expect(await repository.getString('key'), 'second');
      });
    });

    group('getStringList / setStringList', () {
      test('returns null for non-existent key', () async {
        expect(await repository.getStringList('nonexistent'), isNull);
      });

      test('stores and retrieves a string list', () async {
        final result =
            await repository.setStringList('libs', ['lib1', 'lib2', 'lib3']);
        expect(result, isTrue);
        expect(
            await repository.getStringList('libs'), ['lib1', 'lib2', 'lib3']);
      });

      test('stores and retrieves an empty list', () async {
        await repository.setStringList('empty', []);
        expect(await repository.getStringList('empty'), []);
      });
    });

    group('remove', () {
      test('removes an existing string value', () async {
        await repository.setString('key', 'value');
        final result = await repository.remove('key');
        expect(result, isTrue);
        expect(await repository.getString('key'), isNull);
      });

      test('removes an existing string list value', () async {
        await repository.setStringList('list', ['a', 'b']);
        await repository.remove('list');
        expect(await repository.getStringList('list'), isNull);
      });

      test('returns true when removing a non-existent key', () async {
        final result = await repository.remove('nonexistent');
        expect(result, isTrue);
      });
    });
  });
}
