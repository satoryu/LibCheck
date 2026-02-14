import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/repositories/registered_library_repository.dart';
import 'package:libcheck/presentation/pages/library_management_page.dart';
import 'package:libcheck/presentation/providers/registered_library_providers.dart';
import 'package:libcheck/presentation/widgets/error_state_widget.dart';

class FakeRegisteredLibraryRepository implements RegisteredLibraryRepository {
  List<Library> _libraries = [];

  FakeRegisteredLibraryRepository([List<Library>? initial]) {
    if (initial != null) _libraries = List.from(initial);
  }

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

class SlowRegisteredLibraryRepository implements RegisteredLibraryRepository {
  @override
  Future<List<Library>> getAll() =>
      Future.delayed(const Duration(seconds: 5), () => []);
  @override
  Future<void> saveAll(List<Library> libraries) async {}
  @override
  Future<List<Library>> add(Library library) async => [];
  @override
  Future<List<Library>> addAll(List<Library> libraries) async => [];
  @override
  Future<List<Library>> remove(Library library) async => [];
}

class ErrorRegisteredLibraryRepository implements RegisteredLibraryRepository {
  @override
  Future<List<Library>> getAll() async => throw Exception('load error');
  @override
  Future<void> saveAll(List<Library> libraries) async {}
  @override
  Future<List<Library>> add(Library library) async => [];
  @override
  Future<List<Library>> addAll(List<Library> libraries) async => [];
  @override
  Future<List<Library>> remove(Library library) async => [];
}

Widget _buildTestWidget({required RegisteredLibraryRepository repo}) {
  return ProviderScope(
    overrides: [
      registeredLibraryRepositoryProvider.overrideWithValue(repo),
    ],
    child: const MaterialApp(
      home: LibraryManagementPage(),
    ),
  );
}

void main() {
  group('LibraryManagementPage', () {
    testWidgets('shows empty state when no libraries registered',
        (tester) async {
      await tester.pumpWidget(
        _buildTestWidget(repo: FakeRegisteredLibraryRepository()),
      );
      await tester.pumpAndSettle();

      expect(find.text('図書館が登録されていません'), findsOneWidget);
      expect(find.text('図書館を登録する'), findsOneWidget);
    });

    testWidgets('shows registered libraries', (tester) async {
      await tester.pumpWidget(
        _buildTestWidget(
          repo: FakeRegisteredLibraryRepository([_library1, _library2]),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('港区立みなと図書館'), findsOneWidget);
      expect(find.text('渋谷区立中央図書館'), findsOneWidget);
    });

    testWidgets('shows AppBar with title', (tester) async {
      await tester.pumpWidget(
        _buildTestWidget(repo: FakeRegisteredLibraryRepository()),
      );
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, '登録図書館'), findsOneWidget);
    });

    testWidgets('shows add button in AppBar', (tester) async {
      await tester.pumpWidget(
        _buildTestWidget(repo: FakeRegisteredLibraryRepository()),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.add), findsOneWidget);
    });

    testWidgets('shows delete confirmation dialog', (tester) async {
      await tester.pumpWidget(
        _buildTestWidget(
          repo: FakeRegisteredLibraryRepository([_library1]),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.close));
      await tester.pumpAndSettle();

      expect(find.text('図書館の登録を解除しますか？'), findsOneWidget);
      expect(
        find.text('「港区立みなと図書館」の登録を解除します。'),
        findsOneWidget,
      );
      expect(find.text('キャンセル'), findsOneWidget);
      expect(find.text('解除する'), findsOneWidget);
    });

    testWidgets('cancel button dismisses dialog', (tester) async {
      await tester.pumpWidget(
        _buildTestWidget(
          repo: FakeRegisteredLibraryRepository([_library1]),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.close));
      await tester.pumpAndSettle();

      await tester.tap(find.text('キャンセル'));
      await tester.pumpAndSettle();

      expect(find.text('図書館の登録を解除しますか？'), findsNothing);
      expect(find.text('港区立みなと図書館'), findsOneWidget);
    });

    testWidgets('confirming delete removes library and shows SnackBar',
        (tester) async {
      await tester.pumpWidget(
        _buildTestWidget(
          repo: FakeRegisteredLibraryRepository([_library1]),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.close));
      await tester.pumpAndSettle();

      await tester.tap(find.text('解除する'));
      await tester.pumpAndSettle();

      expect(find.text('図書館の登録を解除しました'), findsOneWidget);
      expect(find.text('元に戻す'), findsOneWidget);
      expect(find.text('図書館が登録されていません'), findsOneWidget);
    });

    testWidgets('undo restores deleted library', (tester) async {
      await tester.pumpWidget(
        _buildTestWidget(
          repo: FakeRegisteredLibraryRepository([_library1]),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.close));
      await tester.pumpAndSettle();

      await tester.tap(find.text('解除する'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('元に戻す'));
      await tester.pumpAndSettle();

      expect(find.text('港区立みなと図書館'), findsOneWidget);
    });

    testWidgets('shows location subtitle for each library', (tester) async {
      await tester.pumpWidget(
        _buildTestWidget(
          repo: FakeRegisteredLibraryRepository([_library1]),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('東京都港区'), findsOneWidget);
    });

    testWidgets('shows ErrorStateWidget on error', (tester) async {
      await tester.pumpWidget(
        _buildTestWidget(repo: ErrorRegisteredLibraryRepository()),
      );
      await tester.pumpAndSettle();

      expect(find.byType(ErrorStateWidget), findsOneWidget);
      expect(find.text('エラーが発生しました'), findsOneWidget);
      expect(find.text('再試行'), findsOneWidget);
    });

    testWidgets('shows loading text with indicator', (tester) async {
      await tester.pumpWidget(
        _buildTestWidget(repo: SlowRegisteredLibraryRepository()),
      );
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('読み込み中...'), findsOneWidget);

      // Clean up pending timers
      await tester.pumpAndSettle(const Duration(seconds: 6));
    });
  });
}
