import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/availability_status.dart';
import 'package:libcheck/domain/models/book_availability.dart';
import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/models/library_status.dart';
import 'package:libcheck/domain/repositories/library_repository.dart';
import 'package:libcheck/domain/repositories/registered_library_repository.dart';
import 'package:libcheck/presentation/pages/book_search_result_page.dart';
import 'package:libcheck/presentation/providers/library_providers.dart';
import 'package:libcheck/presentation/providers/registered_library_providers.dart';
import 'package:libcheck/presentation/widgets/library_availability_card.dart';

class FakeLibraryRepository implements LibraryRepository {
  final List<BookAvailability> _result;

  FakeLibraryRepository([this._result = const []]);

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
      _result;
}

class ErrorLibraryRepository implements LibraryRepository {
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
  }) async {
    throw Exception('Network error');
  }
}

class FakeRegisteredLibraryRepository implements RegisteredLibraryRepository {
  final List<Library> _libraries;

  FakeRegisteredLibraryRepository([this._libraries = const []]);

  @override
  Future<List<Library>> getAll() async => List.from(_libraries);

  @override
  Future<void> saveAll(List<Library> libraries) async {}

  @override
  Future<List<Library>> add(Library library) async => List.from(_libraries);

  @override
  Future<List<Library>> addAll(List<Library> libraries) async =>
      List.from(_libraries);

  @override
  Future<List<Library>> remove(Library library) async =>
      List.from(_libraries);
}

const _library1 = Library(
  systemId: 'Tokyo_Minato',
  systemName: '港区図書館',
  libKey: 'みなと',
  libId: '123',
  shortName: 'みなと図書館',
  formalName: '港区立みなと図書館',
  address: '東京都港区芝公園3-2-25',
  pref: '東京都',
  city: '港区',
  category: 'MEDIUM',
);

const _library2 = Library(
  systemId: 'Tokyo_Shibuya',
  systemName: '渋谷区図書館',
  libKey: 'しぶや',
  libId: '456',
  shortName: '渋谷図書館',
  formalName: '渋谷区立中央図書館',
  address: '東京都渋谷区神宮前1-1-1',
  pref: '東京都',
  city: '渋谷区',
  category: 'LARGE',
);

void main() {
  group('BookSearchResultPage', () {
    Widget buildSubject({
      required LibraryRepository libraryRepo,
      required RegisteredLibraryRepository registeredRepo,
      String isbn = '9784123456789',
    }) {
      return ProviderScope(
        overrides: [
          libraryRepositoryProvider.overrideWithValue(libraryRepo),
          registeredLibraryRepositoryProvider
              .overrideWithValue(registeredRepo),
        ],
        child: MaterialApp(
          home: BookSearchResultPage(isbn: isbn),
        ),
      );
    }

    testWidgets('shows AppBar with title', (tester) async {
      await tester.pumpWidget(buildSubject(
        libraryRepo: FakeLibraryRepository(),
        registeredRepo: FakeRegisteredLibraryRepository(),
      ));

      expect(find.widgetWithText(AppBar, '検索結果'), findsOneWidget);
    });

    testWidgets('displays ISBN', (tester) async {
      await tester.pumpWidget(buildSubject(
        libraryRepo: FakeLibraryRepository(),
        registeredRepo: FakeRegisteredLibraryRepository(),
        isbn: '9784123456789',
      ));
      await tester.pumpAndSettle();

      expect(find.textContaining('9784123456789'), findsOneWidget);
    });

    testWidgets('shows loading indicator while fetching', (tester) async {
      await tester.pumpWidget(buildSubject(
        libraryRepo: FakeLibraryRepository(),
        registeredRepo: FakeRegisteredLibraryRepository([_library1]),
      ));

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('shows no library message when no libraries registered',
        (tester) async {
      await tester.pumpWidget(buildSubject(
        libraryRepo: FakeLibraryRepository(),
        registeredRepo: FakeRegisteredLibraryRepository(),
      ));
      await tester.pumpAndSettle();

      expect(find.textContaining('図書館が登録されていません'), findsOneWidget);
    });

    testWidgets('shows availability cards for each library', (tester) async {
      final results = [
        BookAvailability(
          isbn: '9784123456789',
          libraryStatuses: {
            'Tokyo_Minato': const LibraryStatus(
              systemId: 'Tokyo_Minato',
              status: AvailabilityStatus.available,
              libKeyStatuses: {'みなと': '貸出可'},
            ),
            'Tokyo_Shibuya': const LibraryStatus(
              systemId: 'Tokyo_Shibuya',
              status: AvailabilityStatus.checkedOut,
              libKeyStatuses: {'しぶや': '貸出中'},
            ),
          },
        ),
      ];

      await tester.pumpWidget(buildSubject(
        libraryRepo: FakeLibraryRepository(results),
        registeredRepo:
            FakeRegisteredLibraryRepository([_library1, _library2]),
      ));
      await tester.pumpAndSettle();

      expect(find.byType(LibraryAvailabilityCard), findsNWidgets(2));
      expect(find.text('貸出可能'), findsOneWidget);
      expect(find.text('貸出中'), findsOneWidget);
    });

    testWidgets('shows error message on failure', (tester) async {
      await tester.pumpWidget(buildSubject(
        libraryRepo: ErrorLibraryRepository(),
        registeredRepo: FakeRegisteredLibraryRepository([_library1]),
      ));
      await tester.pumpAndSettle();

      expect(find.textContaining('エラー'), findsOneWidget);
    });

    testWidgets('shows retry button on error', (tester) async {
      await tester.pumpWidget(buildSubject(
        libraryRepo: ErrorLibraryRepository(),
        registeredRepo: FakeRegisteredLibraryRepository([_library1]),
      ));
      await tester.pumpAndSettle();

      expect(find.text('再試行'), findsOneWidget);
    });

    testWidgets('shows scan another book button', (tester) async {
      await tester.pumpWidget(buildSubject(
        libraryRepo: FakeLibraryRepository(),
        registeredRepo: FakeRegisteredLibraryRepository(),
      ));
      await tester.pumpAndSettle();

      expect(find.text('別の本をスキャンする'), findsOneWidget);
    });

    testWidgets('scan another button pops back to previous page',
        (tester) async {
      // Simulate navigation stack: Previous page -> BookSearchResultPage
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            libraryRepositoryProvider
                .overrideWithValue(FakeLibraryRepository()),
            registeredLibraryRepositoryProvider
                .overrideWithValue(FakeRegisteredLibraryRepository()),
          ],
          child: MaterialApp(
            home: const Scaffold(body: Text('Previous Page')),
            routes: {
              '/result': (context) =>
                  const BookSearchResultPage(isbn: '9784123456789'),
            },
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Navigate to result page (push onto stack)
      tester
          .state<NavigatorState>(find.byType(Navigator))
          .pushNamed('/result');
      await tester.pumpAndSettle();

      expect(find.text('検索結果'), findsOneWidget);

      // Tap "別の本をスキャンする" button
      await tester.tap(find.text('別の本をスキャンする'));
      await tester.pumpAndSettle();

      // Should pop back to previous page
      expect(find.text('Previous Page'), findsOneWidget);
      expect(find.text('検索結果'), findsNothing);
    });
  });
}
