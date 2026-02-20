import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/book_availability.dart';
import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/repositories/library_repository.dart';
import 'package:libcheck/domain/repositories/registered_library_repository.dart';
import 'package:libcheck/presentation/pages/library_list_page.dart';
import 'package:libcheck/presentation/providers/library_providers.dart';
import 'package:libcheck/presentation/providers/registered_library_providers.dart';
import 'package:libcheck/presentation/widgets/error_state_widget.dart';

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

class FakeRegisteredLibraryRepository implements RegisteredLibraryRepository {
  List<Library> _libraries = [];

  List<Library> get libraries => List.from(_libraries);

  @override
  Future<List<Library>> getAll() async => List.from(_libraries);

  @override
  Future<void> saveAll(List<Library> libraries) async {
    _libraries = List.from(libraries);
  }

  @override
  Future<List<Library>> add(Library library) async {
    if (!_libraries.contains(library)) {
      _libraries.add(library);
    }
    return List.from(_libraries);
  }

  @override
  Future<List<Library>> addAll(List<Library> libraries) async {
    for (final lib in libraries) {
      if (!_libraries.contains(lib)) {
        _libraries.add(lib);
      }
    }
    return List.from(_libraries);
  }

  @override
  Future<List<Library>> remove(Library library) async {
    _libraries.removeWhere((e) => e == library);
    return List.from(_libraries);
  }
}

void main() {
  group('LibraryListPage', () {
    late FakeRegisteredLibraryRepository fakeRegisteredRepo;

    setUp(() {
      fakeRegisteredRepo = FakeRegisteredLibraryRepository();
    });

    Widget buildSubject({
      required LibraryRepository repository,
      String prefecture = '東京都',
      String city = '港区',
    }) {
      return ProviderScope(
        overrides: [
          libraryRepositoryProvider.overrideWithValue(repository),
          registeredLibraryRepositoryProvider
              .overrideWithValue(fakeRegisteredRepo),
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

    testWidgets('register button saves selected libraries', (tester) async {
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

      // Select first library
      await tester.tap(find.byType(CheckboxListTile).first);
      await tester.pump();

      // Tap register button
      await tester.tap(find.byType(FilledButton));
      await tester.pumpAndSettle();

      expect(fakeRegisteredRepo.libraries, hasLength(1));
      expect(fakeRegisteredRepo.libraries[0].formalName, '図書館1');
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
      expect(find.text('図書館を検索中...'), findsOneWidget);
    });
  });
}
