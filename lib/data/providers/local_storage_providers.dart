import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:libcheck/data/repositories/shared_preferences_local_storage_repository.dart';
import 'package:libcheck/domain/repositories/local_storage_repository.dart';

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError(
    'sharedPreferencesProvider must be overridden with a SharedPreferences instance',
  );
});

final localStorageRepositoryProvider = Provider<LocalStorageRepository>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return SharedPreferencesLocalStorageRepository(prefs);
});
