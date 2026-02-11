# Issue #3: ローカルストレージの導入

## Problem Statement

The LibCheck app needs to persist data locally on the device, including registered libraries (Issue #7) and search history (Issue #11). We need a local storage abstraction in the domain layer with a `shared_preferences`-backed implementation in the data layer, following Clean Architecture principles and integrated with Riverpod.

## Requirements

### Functional Requirements

1. Add `shared_preferences` package as a dependency.
2. Define a `LocalStorageRepository` abstract interface in the domain layer for key-value storage operations.
3. Implement `SharedPreferencesLocalStorageRepository` in the data layer using `shared_preferences`.
4. Provide a Riverpod provider for the repository, allowing dependency injection and testability.
5. Support the following operations:
   - `getString(key)` / `setString(key, value)` - for simple string values
   - `getStringList(key)` / `setStringList(key, value)` - for lists (library IDs, history)
   - `remove(key)` - for deleting a stored value
6. All operations must be asynchronous (`Future`-based).

### Non-Functional Requirements

1. The domain layer must not depend on `shared_preferences` — only the data layer implementation should.
2. The repository must be easily mockable for testing.
3. The Riverpod provider must support overriding for tests.

## Constraints

- Use `shared_preferences` as specified in the roadmap.
- Must follow Clean Architecture: interface in `domain/`, implementation in `data/`.
- Must integrate with the existing Riverpod setup from Issue #2.

## Acceptance Criteria

1. `shared_preferences` is listed as a dependency in `pubspec.yaml`.
2. `LocalStorageRepository` abstract class exists in `lib/domain/repositories/`.
3. `SharedPreferencesLocalStorageRepository` exists in `lib/data/repositories/`.
4. A Riverpod provider for `LocalStorageRepository` exists.
5. Unit tests verify the repository implementation works correctly.
6. All tests pass with `flutter test`.

## User Stories

- **As a developer**, I want a local storage abstraction so that I can persist data without coupling to a specific storage library.
- **As a developer**, I want the storage repository injectable via Riverpod so that I can mock it in tests.
- **As a developer**, I want `getStringList`/`setStringList` operations so that I can store registered library IDs and search history.
