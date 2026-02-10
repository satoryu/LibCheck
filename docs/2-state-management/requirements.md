# Issue #2: 状態管理の導入

## Problem Statement

The LibCheck app currently has no state management solution. As we add features like library registration, book search, and search history, we need a robust, testable state management foundation. The app needs `flutter_riverpod` to manage application state in a declarative, provider-based manner that integrates well with Clean Architecture.

## Requirements

### Functional Requirements

1. Add `flutter_riverpod` package as a dependency.
2. Wrap the app root with `ProviderScope` to enable Riverpod throughout the widget tree.
3. Create a sample provider and corresponding UI to demonstrate the Riverpod integration is working correctly.
4. Update existing tests to work with the `ProviderScope` wrapper.
5. All existing tests must continue to pass.

### Non-Functional Requirements

1. Riverpod providers must be testable in isolation using `ProviderContainer`.
2. The integration must not break the Clean Architecture layer separation established in Issue #1.
3. Providers should be organized under the appropriate layer directory (presentation layer for UI state, domain layer for business logic providers).

## Constraints

- Use `flutter_riverpod` (not `riverpod` or `hooks_riverpod`), as the project uses standard Flutter widgets without hooks.
- Must be compatible with Dart SDK ^3.10.8 and Flutter 3.38.9.
- No other state management packages should be introduced.

## Acceptance Criteria

1. `flutter_riverpod` is listed as a dependency in `pubspec.yaml`.
2. `ProviderScope` wraps the app in `lib/main.dart`.
3. A sample `appTitleProvider` exists to demonstrate provider usage and testability.
4. `HomePage` uses a `ConsumerWidget` to read the provider value and display it.
5. Unit tests verify the provider returns the expected value.
6. Widget tests verify the UI reads from the provider correctly.
7. All tests pass with `flutter test`.

## User Stories

- **As a developer**, I want Riverpod set up as the state management solution so that I can manage app state declaratively in future features.
- **As a developer**, I want a working example provider with tests so that I have a pattern to follow when adding feature-specific providers.
- **As a developer**, I want providers to be testable in isolation so that I can write fast, reliable unit tests.
