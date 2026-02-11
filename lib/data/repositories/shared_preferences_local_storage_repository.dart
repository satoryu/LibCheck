import 'package:shared_preferences/shared_preferences.dart';

import 'package:libcheck/domain/repositories/local_storage_repository.dart';

class SharedPreferencesLocalStorageRepository
    implements LocalStorageRepository {
  final SharedPreferences _prefs;

  SharedPreferencesLocalStorageRepository(this._prefs);

  @override
  Future<String?> getString(String key) async => _prefs.getString(key);

  @override
  Future<bool> setString(String key, String value) => _prefs.setString(key, value);

  @override
  Future<List<String>?> getStringList(String key) async =>
      _prefs.getStringList(key);

  @override
  Future<bool> setStringList(String key, List<String> value) =>
      _prefs.setStringList(key, value);

  @override
  Future<bool> remove(String key) => _prefs.remove(key);
}
