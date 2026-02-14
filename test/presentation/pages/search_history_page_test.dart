import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/search_history_entry.dart';
import 'package:libcheck/domain/repositories/search_history_repository.dart';
import 'package:libcheck/presentation/pages/search_history_page.dart';
import 'package:libcheck/presentation/providers/search_history_providers.dart';
import 'package:libcheck/presentation/widgets/search_history_card.dart';

class FakeSearchHistoryRepository implements SearchHistoryRepository {
  List<SearchHistoryEntry> _entries;

  FakeSearchHistoryRepository([List<SearchHistoryEntry>? entries])
      : _entries = entries ?? [];

  @override
  Future<List<SearchHistoryEntry>> getAll() async {
    final sorted = List<SearchHistoryEntry>.from(_entries);
    sorted.sort((a, b) => b.searchedAt.compareTo(a.searchedAt));
    return sorted;
  }

  @override
  Future<void> save(SearchHistoryEntry entry) async {
    _entries.removeWhere((e) => e.isbn == entry.isbn);
    _entries.add(entry);
  }

  @override
  Future<void> remove(String isbn) async {
    _entries.removeWhere((e) => e.isbn == isbn);
  }

  @override
  Future<void> removeAll() async {
    _entries = [];
  }
}

void main() {
  group('SearchHistoryPage', () {
    late FakeSearchHistoryRepository fakeRepo;

    setUp(() {
      fakeRepo = FakeSearchHistoryRepository();
    });

    Widget buildSubject({
      FakeSearchHistoryRepository? repo,
      List<NavigatorObserver>? observers,
    }) {
      return ProviderScope(
        overrides: [
          searchHistoryRepositoryProvider.overrideWithValue(repo ?? fakeRepo),
        ],
        child: MaterialApp(
          home: const SearchHistoryPage(),
          navigatorObservers: observers ?? [],
          routes: {
            '/result': (context) {
              final isbn = ModalRoute.of(context)!.settings.arguments as String?;
              return Scaffold(body: Text('Result: $isbn'));
            },
          },
        ),
      );
    }

    testWidgets('shows AppBar with title', (tester) async {
      await tester.pumpWidget(buildSubject());
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, '検索履歴'), findsOneWidget);
    });

    testWidgets('shows empty state when no history', (tester) async {
      await tester.pumpWidget(buildSubject());
      await tester.pumpAndSettle();

      expect(find.textContaining('検索履歴はありません'), findsOneWidget);
    });

    testWidgets('shows history cards when entries exist', (tester) async {
      fakeRepo = FakeSearchHistoryRepository([
        SearchHistoryEntry(
          isbn: '9784003101018',
          searchedAt: DateTime(2026, 2, 15, 10, 0),
          libraryStatuses: {'Tokyo_Chiyoda': 'available'},
        ),
        SearchHistoryEntry(
          isbn: '9784167158057',
          searchedAt: DateTime(2026, 2, 14, 9, 0),
          libraryStatuses: {'Tokyo_Shibuya': 'checkedOut'},
        ),
      ]);

      await tester.pumpWidget(buildSubject(repo: fakeRepo));
      await tester.pumpAndSettle();

      expect(find.byType(SearchHistoryCard), findsNWidgets(2));
      expect(find.textContaining('9784003101018'), findsOneWidget);
      expect(find.textContaining('9784167158057'), findsOneWidget);
    });

    testWidgets('hides delete all button when no history', (tester) async {
      await tester.pumpWidget(buildSubject());
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.delete_sweep), findsNothing);
    });

    testWidgets('shows delete all button when entries exist', (tester) async {
      fakeRepo = FakeSearchHistoryRepository([
        SearchHistoryEntry(
          isbn: '9784003101018',
          searchedAt: DateTime(2026, 2, 15),
          libraryStatuses: {},
        ),
      ]);

      await tester.pumpWidget(buildSubject(repo: fakeRepo));
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.delete_sweep), findsOneWidget);
    });

    testWidgets('delete all shows confirmation dialog', (tester) async {
      fakeRepo = FakeSearchHistoryRepository([
        SearchHistoryEntry(
          isbn: '9784003101018',
          searchedAt: DateTime(2026, 2, 15),
          libraryStatuses: {},
        ),
      ]);

      await tester.pumpWidget(buildSubject(repo: fakeRepo));
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.delete_sweep));
      await tester.pumpAndSettle();

      expect(find.text('全履歴を削除'), findsOneWidget);
      expect(find.text('削除'), findsOneWidget);
      expect(find.text('キャンセル'), findsOneWidget);
    });

    testWidgets('confirming delete all removes all entries', (tester) async {
      fakeRepo = FakeSearchHistoryRepository([
        SearchHistoryEntry(
          isbn: '9784003101018',
          searchedAt: DateTime(2026, 2, 15),
          libraryStatuses: {},
        ),
      ]);

      await tester.pumpWidget(buildSubject(repo: fakeRepo));
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.delete_sweep));
      await tester.pumpAndSettle();

      await tester.tap(find.text('削除'));
      await tester.pumpAndSettle();

      expect(find.byType(SearchHistoryCard), findsNothing);
      expect(find.textContaining('検索履歴はありません'), findsOneWidget);
    });

    testWidgets('swipe to dismiss removes individual entry', (tester) async {
      fakeRepo = FakeSearchHistoryRepository([
        SearchHistoryEntry(
          isbn: '9784003101018',
          searchedAt: DateTime(2026, 2, 15),
          libraryStatuses: {},
        ),
        SearchHistoryEntry(
          isbn: '9784167158057',
          searchedAt: DateTime(2026, 2, 14),
          libraryStatuses: {},
        ),
      ]);

      await tester.pumpWidget(buildSubject(repo: fakeRepo));
      await tester.pumpAndSettle();

      // Swipe the first card (9784003101018)
      await tester.drag(
        find.textContaining('9784003101018'),
        const Offset(-500, 0),
      );
      await tester.pumpAndSettle();

      expect(find.byType(SearchHistoryCard), findsOneWidget);
      expect(find.textContaining('9784167158057'), findsOneWidget);
    });
  });
}
