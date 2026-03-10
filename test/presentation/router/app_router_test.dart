import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

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

final _fakeLibrary = Library(
  systemId: 'Tokyo_Pref',
  systemName: '東京都立図書館',
  libKey: 'Tokyo_Pref',
  libId: '1',
  shortName: '東京都立図書館',
  formalName: '東京都立中央図書館',
  address: '東京都港区南麻布9-26-1',
  pref: '東京都',
  city: '港区',
  category: '都道府県立',
);

class FakeRegisteredLibraryRepository implements RegisteredLibraryRepository {
  FakeRegisteredLibraryRepository([List<Library>? libraries])
      : _libraries = libraries ?? const [];

  final List<Library> _libraries;

  @override
  Future<List<Library>> getAll() async => _libraries;
  @override
  Future<void> saveAll(List<Library> libraries) async {}
  @override
  Future<List<Library>> add(Library library) async => _libraries;
  @override
  Future<List<Library>> addAll(List<Library> libraries) async => _libraries;
  @override
  Future<List<Library>> remove(Library library) async => _libraries;
}

void main() {
  group('AppRouter', () {
    testWidgets(
        '図書館登録済みの場合は/でホーム画面を表示する',
        (tester) async {
      final container = ProviderContainer(
        overrides: [
          registeredLibraryRepositoryProvider.overrideWithValue(
            FakeRegisteredLibraryRepository([_fakeLibrary]),
          ),
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

    testWidgets(
        '図書館未登録の場合は/にアクセスすると/libraryへリダイレクトされる',
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

      expect(find.widgetWithText(AppBar, '登録図書館'), findsOneWidget);
      expect(find.byType(NavigationBar), findsOneWidget);
      expect(find.text('図書館が登録されていません'), findsOneWidget);
      expect(find.text('図書館を登録する'), findsOneWidget);
    });

    testWidgets('tapping library tab navigates to library management page',
        (tester) async {
      final container = ProviderContainer(
        overrides: [
          registeredLibraryRepositoryProvider.overrideWithValue(
            FakeRegisteredLibraryRepository([_fakeLibrary]),
          ),
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
          registeredLibraryRepositoryProvider.overrideWithValue(
            FakeRegisteredLibraryRepository([_fakeLibrary]),
          ),
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
          registeredLibraryRepositoryProvider.overrideWithValue(
            FakeRegisteredLibraryRepository([_fakeLibrary]),
          ),
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
          registeredLibraryRepositoryProvider.overrideWithValue(
            FakeRegisteredLibraryRepository([_fakeLibrary]),
          ),
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
