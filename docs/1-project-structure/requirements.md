# Issue #1: プロジェクト構造の整理

## Problem Statement

The LibCheck project currently uses the default Flutter counter app template. Before implementing any features (ISBN scanning, library search, etc.), we need a well-organized project structure based on Clean Architecture to ensure maintainability, testability, and scalability as the app grows.

## Requirements

### Functional Requirements

1. Remove the default Flutter counter app template code (MyHomePage, counter logic).
2. Replace with a minimal app shell that displays a simple home screen with the app title "LibCheck".
3. Set up a Clean Architecture directory structure under `lib/`:
   - `lib/domain/` - Business logic layer (entities, repository interfaces, use cases)
   - `lib/data/` - Data layer (data sources, repository implementations, models, API clients)
   - `lib/presentation/` - Presentation layer (pages, widgets, view models)
4. Ensure existing tests are updated to pass with the new app structure.

### Non-Functional Requirements

1. The directory structure must follow Clean Architecture principles with clear separation of concerns.
2. Dependencies must flow inward: `presentation` -> `domain` <- `data`.
3. The structure must be ready for future feature additions (ISBN scanning, library search, local storage).

## Constraints

- Must stay within the existing Flutter/Dart tech stack.
- No new package dependencies are needed for this task.
- The app must compile and all tests must pass after changes.

## Acceptance Criteria

1. The default counter app template code is completely removed.
2. A new `LibCheckApp` widget exists as the root app widget in `lib/main.dart`.
3. A simple home page is displayed with the title "LibCheck".
4. The directory structure `lib/domain/`, `lib/data/`, `lib/presentation/` exists with placeholder files.
5. `flutter test` passes with updated tests.
6. The feature branch `feature/1-project-structure` contains all changes.

## User Stories

- **As a developer**, I want the project to follow Clean Architecture so that I can easily add new features in the correct layer.
- **As a developer**, I want the counter app template removed so that the codebase is clean and ready for LibCheck-specific features.
- **As a developer**, I want a minimal app shell running so that I can verify the project builds and runs correctly.
