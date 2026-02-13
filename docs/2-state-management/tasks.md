# Issue #2: 状態管理の導入 - Tasks

## Implementation Checklist

- [x] 1. Add `flutter_riverpod` dependency
  - Run `flutter pub add flutter_riverpod`
  - Verify `pubspec.yaml` has the dependency
  - Run `flutter pub get` to resolve

- [x] 2. Create the sample provider (TDD)
  - Write unit test for `appTitleProvider` using `ProviderContainer`
  - Create `lib/presentation/providers/app_providers.dart` with `appTitleProvider`
  - Verify test passes

- [x] 3. Wrap app with `ProviderScope`
  - Update `lib/main.dart` to wrap `LibCheckApp` with `ProviderScope`

- [x] 4. Convert `HomePage` to `ConsumerWidget` (TDD)
  - Update widget test for `HomePage` to use `ProviderScope` wrapper
  - Convert `HomePage` from `StatelessWidget` to `ConsumerWidget`
  - Use `ref.watch(appTitleProvider)` for the AppBar title

- [x] 5. Update existing tests
  - Update `test/app_test.dart` to wrap with `ProviderScope`
  - Update `test/widget_test.dart` to wrap with `ProviderScope`
  - Verify all tests pass with `flutter test` (7/7 passed)

- [x] 6. Commit and create pull request
