# Issue #1: プロジェクト構造の整理 - Tasks

## Implementation Checklist

- [x] 1. Create Clean Architecture directory structure
  - Create `lib/domain/` with `.gitkeep`
  - Create `lib/data/` with `.gitkeep`
  - Create `lib/presentation/pages/` directory

- [x] 2. Implement the minimal app shell (TDD)
  - Write test for `LibCheckApp` widget (renders MaterialApp with correct title)
  - Write test for `HomePage` widget (renders AppBar with "LibCheck" title)
  - Create `lib/app.dart` with `LibCheckApp` widget
  - Create `lib/presentation/pages/home_page.dart` with `HomePage` widget
  - Update `lib/main.dart` to use `LibCheckApp`

- [x] 3. Remove counter app template code
  - Remove `MyApp`, `MyHomePage`, `_MyHomePageState` from `lib/main.dart`
  - Remove old `test/widget_test.dart` counter test

- [x] 4. Verify all tests pass
  - Run `flutter test` and confirm all tests pass (5/5 passed)

- [x] 5. Commit and create pull request
