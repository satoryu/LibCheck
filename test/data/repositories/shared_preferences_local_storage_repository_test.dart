import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:libcheck/data/repositories/shared_preferences_local_storage_repository.dart';

void main() {
  group('SharedPreferencesLocalStorageRepository', () {
    late SharedPreferencesLocalStorageRepository repository;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      repository = SharedPreferencesLocalStorageRepository(prefs);
    });

    test('stores and retrieves a string value', () async {
      final result = await repository.setString('key', 'hello');
      expect(result, isTrue);
      expect(await repository.getString('key'), 'hello');
    });

    test('stores and retrieves a string list', () async {
      final result =
          await repository.setStringList('libs', ['lib1', 'lib2', 'lib3']);
      expect(result, isTrue);
      expect(
          await repository.getStringList('libs'), ['lib1', 'lib2', 'lib3']);
    });

    test('removes an existing string value', () async {
      await repository.setString('key', 'value');
      final result = await repository.remove('key');
      expect(result, isTrue);
      expect(await repository.getString('key'), isNull);
    });
  });
}
