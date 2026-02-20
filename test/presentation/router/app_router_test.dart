import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:libcheck/domain/models/book_availability.dart';
import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/repositories/library_repository.dart';
import 'package:libcheck/domain/models/search_history_entry.dart';
import 'package:libcheck/domain/repositories/registered_library_repository.dart';
import 'package:libcheck/domain/repositories/search_history_repository.dart';
import 'package:libcheck/presentation/providers/library_providers.dart';
import 'package:libcheck/presentation/providers/registered_library_providers.dart';
import 'package:libcheck/presentation/providers/search_history_providers.dart';
import 'package:libcheck/presentation/router/app_router.dart';

class FakeLibraryRepository implements LibraryRepository {
  @override
  Future<List<Library>> getLibraries({
    required String pref,
    String? city,
  }) async =>
      [];

  @override
  Future<List<BookAvailability>> checkBookAvailability({
    required List<String> isbn,
    required List<String> systemIds,
  }) async =>
      [];
}

class FakeSearchHistoryRepository implements SearchHistoryRepository {
  @override
  Future<List<SearchHistoryEntry>> getAll() async => [];
  @override
  Future<void> save(SearchHistoryEntry entry) async {}
  @override
  Future<void> remove(String isbn) async {}
  @override
  Future<void> removeAll() async {}
}

class FakeRegisteredLibraryRepository implements RegisteredLibraryRepository {
  @override
  Future<List<Library>> getAll() async => [];
  @override
  Future<void> saveAll(List<Library> libraries) async {}
  @override
  Future<List<Library>> add(Library library) async => [];
  @override
  Future<List<Library>> addAll(List<Library> libraries) async => [];
  @override
  Future<List<Library>> remove(Library library) async => [];
}

void main() {
  group('AppRouter', () {
    testWidgets('navigates to home page at / with BottomNavigationBar',
        (tester) async {
      final container = ProviderContainer(
        overrides: [
          registeredLibraryRepositoryProvider
              .overrideWithValue(FakeRegisteredLibraryRepository()),
        ],
      );
      addTearDown(container.dispose);

      final router = container.read(routerProvider);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('LibCheck'), findsOneWidget);
      expect(find.byType(NavigationBar), findsOneWidget);
      expect(find.text('ホーム'), findsOneWidget);
      expect(find.text('図書館'), findsOneWidget);
      expect(find.text('履歴'), findsOneWidget);
    });

    testWidgets('tapping library tab navigates to library management page',
        (tester) async {
      final container = ProviderContainer(
        overrides: [
          registeredLibraryRepositoryProvider
              .overrideWithValue(FakeRegisteredLibraryRepository()),
        ],
      );
      addTearDown(container.dispose);

      final router = container.read(routerProvider);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('図書館'));
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, '登録図書館'), findsOneWidget);
    });

    testWidgets('tapping history tab navigates to search history page',
        (tester) async {
      final container = ProviderContainer(
        overrides: [
          registeredLibraryRepositoryProvider
              .overrideWithValue(FakeRegisteredLibraryRepository()),
          searchHistoryRepositoryProvider
              .overrideWithValue(FakeSearchHistoryRepository()),
        ],
      );
      addTearDown(container.dispose);

      final router = container.read(routerProvider);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('履歴'));
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, '検索履歴'), findsOneWidget);
    });

    testWidgets('navigates to prefecture selection page at /library/add',
        (tester) async {
      final container = ProviderContainer(
        overrides: [
          registeredLibraryRepositoryProvider
              .overrideWithValue(FakeRegisteredLibraryRepository()),
        ],
      );
      addTearDown(container.dispose);

      final router = container.read(routerProvider);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );
      await tester.pumpAndSettle();

      router.go('/library/add');
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, '都道府県を選択'), findsOneWidget);
    });

    testWidgets('navigates to search result page at /result/:isbn',
        (tester) async {
      final container = ProviderContainer(
        overrides: [
          registeredLibraryRepositoryProvider
              .overrideWithValue(FakeRegisteredLibraryRepository()),
          libraryRepositoryProvider
              .overrideWithValue(FakeLibraryRepository()),
          searchHistoryRepositoryProvider
              .overrideWithValue(FakeSearchHistoryRepository()),
        ],
      );
      addTearDown(container.dispose);

      final router = container.read(routerProvider);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );
      await tester.pumpAndSettle();

      router.go('/result/9784123456789');
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, '検索結果'), findsOneWidget);
      expect(find.textContaining('9784123456789'), findsOneWidget);
    });

  });
}
