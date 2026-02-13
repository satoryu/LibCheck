# Issue #3: ローカルストレージの導入 - Tasks

## Implementation Checklist

- [x] 1. Add `shared_preferences` dependency
  - Run `flutter pub add shared_preferences`
  - Verify `pubspec.yaml` has the dependency

- [x] 2. Define `LocalStorageRepository` interface (TDD)
  - Write unit test verifying the abstract class can be implemented (mock test)
  - Create `lib/domain/repositories/local_storage_repository.dart`
  - Remove `lib/domain/.gitkeep` (no longer needed)

- [x] 3. Implement `SharedPreferencesLocalStorageRepository` (TDD)
  - Write unit tests for all operations (getString, setString, getStringList, setStringList, remove)
  - Create `lib/data/repositories/shared_preferences_local_storage_repository.dart`
  - Verify all tests pass (10/10 passed)

- [x] 4. Create Riverpod providers for local storage
  - Create `lib/data/providers/local_storage_providers.dart`
  - Define `sharedPreferencesProvider` (throws by default, overridden at startup)
  - Define `localStorageRepositoryProvider` (creates implementation from sharedPreferencesProvider)
  - Write tests for provider wiring (3/3 passed)
  - Remove `lib/data/.gitkeep` (no longer needed)

- [x] 5. Update `main.dart` to initialize SharedPreferences
  - Make `main()` async
  - Call `SharedPreferences.getInstance()` before `runApp`
  - Override `sharedPreferencesProvider` in `ProviderScope`
  - Update existing tests to provide SharedPreferences override

- [x] 6. Verify all tests pass
  - Run `flutter test` and confirm all tests pass (23/23 passed)

- [x] 7. Commit and create pull request
