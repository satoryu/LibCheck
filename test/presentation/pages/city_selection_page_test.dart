import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/book_availability.dart';
import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/repositories/library_repository.dart';
import 'package:libcheck/presentation/pages/city_selection_page.dart';
import 'package:libcheck/presentation/providers/library_providers.dart';
import 'package:libcheck/presentation/widgets/error_state_widget.dart';

class MockLibraryRepository implements LibraryRepository {
  final List<Library> _libraries;

  MockLibraryRepository(this._libraries);

  @override
  Future<List<Library>> getLibraries({
    required String pref,
    String? city,
  }) async {
    return _libraries.where((lib) => lib.pref == pref).toList();
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
  required String pref,
  required String city,
  String libId = 'id1',
}) {
  return Library(
    systemId: 'system1',
    systemName: 'テスト図書館システム',
    libKey: 'key1',
    libId: libId,
    shortName: 'テスト図書館',
    formalName: 'テスト図書館',
    address: '$pref$city',
    pref: pref,
    city: city,
    category: 'MEDIUM',
  );
}

void main() {
  group('CitySelectionPage', () {
    Widget buildSubject({
      required LibraryRepository repository,
      String prefecture = '東京都',
    }) {
      return ProviderScope(
        overrides: [
          libraryRepositoryProvider.overrideWithValue(repository),
        ],
        child: MaterialApp(
          home: CitySelectionPage(prefecture: prefecture),
        ),
      );
    }

    testWidgets('renders AppBar with prefecture name', (tester) async {
      await tester.pumpWidget(buildSubject(
        repository: MockLibraryRepository([]),
      ));

      expect(find.widgetWithText(AppBar, '東京都の市区町村'), findsOneWidget);
    });

    testWidgets('shows loading indicator while fetching', (tester) async {
      await tester.pumpWidget(buildSubject(
        repository: MockLibraryRepository([]),
      ));

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('displays city list after loading', (tester) async {
      final libraries = [
        _createLibrary(pref: '東京都', city: '港区', libId: '1'),
        _createLibrary(pref: '東京都', city: '新宿区', libId: '2'),
        _createLibrary(pref: '東京都', city: '千代田区', libId: '3'),
      ];

      await tester.pumpWidget(buildSubject(
        repository: MockLibraryRepository(libraries),
      ));
      await tester.pumpAndSettle();

      expect(find.text('千代田区'), findsOneWidget);
      expect(find.text('新宿区'), findsOneWidget);
      expect(find.text('港区'), findsOneWidget);
    });

    testWidgets('displays search field', (tester) async {
      final libraries = [
        _createLibrary(pref: '東京都', city: '港区', libId: '1'),
      ];

      await tester.pumpWidget(buildSubject(
        repository: MockLibraryRepository(libraries),
      ));
      await tester.pumpAndSettle();

      expect(find.byType(TextField), findsOneWidget);
    });

    testWidgets('filters cities by search text', (tester) async {
      final libraries = [
        _createLibrary(pref: '東京都', city: '港区', libId: '1'),
        _createLibrary(pref: '東京都', city: '新宿区', libId: '2'),
        _createLibrary(pref: '東京都', city: '千代田区', libId: '3'),
      ];

      await tester.pumpWidget(buildSubject(
        repository: MockLibraryRepository(libraries),
      ));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '港');
      await tester.pump();

      expect(find.text('港区'), findsOneWidget);
      expect(find.text('新宿区'), findsNothing);
      expect(find.text('千代田区'), findsNothing);
    });

    testWidgets('shows ErrorStateWidget on failure', (tester) async {
      await tester.pumpWidget(buildSubject(
        repository: ErrorLibraryRepository(),
      ));
      await tester.pumpAndSettle();

      expect(find.byType(ErrorStateWidget), findsOneWidget);
      expect(find.text('エラーが発生しました'), findsOneWidget);
      expect(find.text('再試行'), findsOneWidget);
    });

    testWidgets('shows loading text with indicator', (tester) async {
      await tester.pumpWidget(buildSubject(
        repository: MockLibraryRepository([]),
      ));
      // Check loading state before settling
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('読み込み中...'), findsOneWidget);
    });
  });
}
