import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:libcheck/data/providers/local_storage_providers.dart';
import 'package:libcheck/data/repositories/shared_preferences_local_storage_repository.dart';
import 'package:libcheck/domain/repositories/local_storage_repository.dart';

void main() {
  group('local storage providers', () {
    test('localStorageRepositoryProvider returns SharedPreferencesLocalStorageRepository',
        () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();

      final container = ProviderContainer(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
      );
      addTearDown(container.dispose);

      final repository = container.read(localStorageRepositoryProvider);
      expect(repository, isA<LocalStorageRepository>());
      expect(repository, isA<SharedPreferencesLocalStorageRepository>());
    });
  });
}
