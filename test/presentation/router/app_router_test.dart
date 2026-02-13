import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:libcheck/domain/models/book_availability.dart';
import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/repositories/library_repository.dart';
import 'package:libcheck/domain/repositories/registered_library_repository.dart';
import 'package:libcheck/presentation/providers/library_providers.dart';
import 'package:libcheck/presentation/providers/registered_library_providers.dart';
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
    test('routerProvider returns a GoRouter instance', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final router = container.read(routerProvider);
      expect(router, isA<GoRouter>());
    });

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

    testWidgets('tapping history tab navigates to history placeholder page',
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

    testWidgets('navigates to city selection page at /library/add/:pref',
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

      router.go('/library/add/東京都');
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, '東京都の市区町村'), findsOneWidget);
    });

    testWidgets(
        'navigates to library list page at /library/add/:pref/:city',
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

      router.go('/library/add/東京都/港区');
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, '港区の図書館'), findsOneWidget);
    });

    testWidgets('navigates to search result page at /result/:isbn',
        (tester) async {
      final container = ProviderContainer(
        overrides: [
          registeredLibraryRepositoryProvider
              .overrideWithValue(FakeRegisteredLibraryRepository()),
          libraryRepositoryProvider
              .overrideWithValue(FakeLibraryRepository()),
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

    testWidgets('navigates to barcode scanner page at /scan',
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

      router.go('/scan');
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, 'バーコードスキャン'), findsOneWidget);
    });

    testWidgets('navigates to ISBN input page at /isbn-input',
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

      router.go('/isbn-input');
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, 'ISBN入力'), findsOneWidget);
    });

  });
}
