import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/book_availability.dart';
import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/repositories/library_repository.dart';
import 'package:libcheck/presentation/pages/library_list_page.dart';
import 'package:libcheck/presentation/providers/library_providers.dart';

class MockLibraryRepository implements LibraryRepository {
  final List<Library> _libraries;

  MockLibraryRepository(this._libraries);

  @override
  Future<List<Library>> getLibraries({
    required String pref,
    String? city,
  }) async {
    return _libraries
        .where((lib) => lib.pref == pref && (city == null || lib.city == city))
        .toList();
  }

  @override
  Future<List<BookAvailability>> checkBookAvailability({
    required List<String> isbn,
    required List<String> systemIds,
  }) async {
    return [];
  }
}

class ErrorLibraryRepository implements LibraryRepository {
  @override
  Future<List<Library>> getLibraries({
    required String pref,
    String? city,
  }) async {
    throw Exception('Network error');
  }

  @override
  Future<List<BookAvailability>> checkBookAvailability({
    required List<String> isbn,
    required List<String> systemIds,
  }) async {
    return [];
  }
}

Library _createLibrary({
  required String formalName,
  required String address,
  String pref = '東京都',
  String city = '港区',
  String libId = 'id1',
}) {
  return Library(
    systemId: 'system1',
    systemName: 'テスト図書館システム',
    libKey: 'key1',
    libId: libId,
    shortName: formalName,
    formalName: formalName,
    address: address,
    pref: pref,
    city: city,
    category: 'MEDIUM',
  );
}

void main() {
  group('LibraryListPage', () {
    Widget buildSubject({
      required LibraryRepository repository,
      String prefecture = '東京都',
      String city = '港区',
    }) {
      return ProviderScope(
        overrides: [
          libraryRepositoryProvider.overrideWithValue(repository),
        ],
        child: MaterialApp(
          home: LibraryListPage(prefecture: prefecture, city: city),
        ),
      );
    }

    testWidgets('renders AppBar with city name', (tester) async {
      await tester.pumpWidget(buildSubject(
        repository: MockLibraryRepository([]),
      ));

      expect(find.widgetWithText(AppBar, '港区の図書館'), findsOneWidget);
    });

    testWidgets('shows loading indicator while fetching', (tester) async {
      await tester.pumpWidget(buildSubject(
        repository: MockLibraryRepository([]),
      ));

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('displays library list after loading', (tester) async {
      final libraries = [
        _createLibrary(
          formalName: '東京都立中央図書館',
          address: '東京都港区南麻布5-7-13',
          libId: '1',
        ),
        _createLibrary(
          formalName: '港区立みなと図書館',
          address: '東京都港区芝浦3-16-25',
          libId: '2',
        ),
      ];

      await tester.pumpWidget(buildSubject(
        repository: MockLibraryRepository(libraries),
      ));
      await tester.pumpAndSettle();

      expect(find.text('東京都立中央図書館'), findsOneWidget);
      expect(find.text('港区立みなと図書館'), findsOneWidget);
    });

    testWidgets('displays library address', (tester) async {
      final libraries = [
        _createLibrary(
          formalName: '東京都立中央図書館',
          address: '東京都港区南麻布5-7-13',
        ),
      ];

      await tester.pumpWidget(buildSubject(
        repository: MockLibraryRepository(libraries),
      ));
      await tester.pumpAndSettle();

      expect(find.text('東京都港区南麻布5-7-13'), findsOneWidget);
    });

    testWidgets('shows checkboxes for each library', (tester) async {
      final libraries = [
        _createLibrary(
          formalName: '図書館1',
          address: '住所1',
          libId: '1',
        ),
        _createLibrary(
          formalName: '図書館2',
          address: '住所2',
          libId: '2',
        ),
      ];

      await tester.pumpWidget(buildSubject(
        repository: MockLibraryRepository(libraries),
      ));
      await tester.pumpAndSettle();

      expect(find.byType(CheckboxListTile), findsNWidgets(2));
    });

    testWidgets('can toggle library selection', (tester) async {
      final libraries = [
        _createLibrary(
          formalName: '図書館1',
          address: '住所1',
        ),
      ];

      await tester.pumpWidget(buildSubject(
        repository: MockLibraryRepository(libraries),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.byType(CheckboxListTile));
      await tester.pump();

      final checkbox =
          tester.widget<CheckboxListTile>(find.byType(CheckboxListTile));
      expect(checkbox.value, isTrue);
    });

    testWidgets('shows selected count in button', (tester) async {
      final libraries = [
        _createLibrary(
          formalName: '図書館1',
          address: '住所1',
          libId: '1',
        ),
        _createLibrary(
          formalName: '図書館2',
          address: '住所2',
          libId: '2',
        ),
      ];

      await tester.pumpWidget(buildSubject(
        repository: MockLibraryRepository(libraries),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.byType(CheckboxListTile).first);
      await tester.pump();

      expect(find.textContaining('1件選択中'), findsOneWidget);
    });

    testWidgets('register button is disabled when no selection',
        (tester) async {
      final libraries = [
        _createLibrary(
          formalName: '図書館1',
          address: '住所1',
        ),
      ];

      await tester.pumpWidget(buildSubject(
        repository: MockLibraryRepository(libraries),
      ));
      await tester.pumpAndSettle();

      final button = tester.widget<FilledButton>(find.byType(FilledButton));
      expect(button.onPressed, isNull);
    });

    testWidgets('shows error message on failure', (tester) async {
      await tester.pumpWidget(buildSubject(
        repository: ErrorLibraryRepository(),
      ));
      await tester.pumpAndSettle();

      expect(find.textContaining('エラー'), findsOneWidget);
    });
  });
}
