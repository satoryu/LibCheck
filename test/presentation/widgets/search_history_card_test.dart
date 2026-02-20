import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/search_history_entry.dart';
import 'package:libcheck/presentation/widgets/search_history_card.dart';

void main() {
  group('SearchHistoryCard', () {
    Widget buildSubject({
      required SearchHistoryEntry entry,
      VoidCallback? onTap,
      DateTime? now,
    }) {
      return MaterialApp(
        home: Scaffold(
          body: SearchHistoryCard(
            entry: entry,
            onTap: onTap ?? () {},
            now: now,
          ),
        ),
      );
    }

    testWidgets('displays ISBN', (tester) async {
      final entry = SearchHistoryEntry(
        isbn: '9784003101018',
        searchedAt: DateTime(2026, 2, 15, 10, 30),
        libraryStatuses: {'Tokyo_Chiyoda': 'available'},
      );

      await tester.pumpWidget(buildSubject(entry: entry));
      expect(find.textContaining('9784003101018'), findsOneWidget);
    });

    testWidgets('displays time for today', (tester) async {
      final now = DateTime(2026, 2, 15, 14, 0);
      final entry = SearchHistoryEntry(
        isbn: '9784003101018',
        searchedAt: DateTime(2026, 2, 15, 10, 30),
        libraryStatuses: {},
      );

      await tester.pumpWidget(buildSubject(entry: entry, now: now));
      expect(find.text('10:30'), findsOneWidget);
    });

    testWidgets('displays "昨日" for yesterday', (tester) async {
      final now = DateTime(2026, 2, 15, 14, 0);
      final entry = SearchHistoryEntry(
        isbn: '9784003101018',
        searchedAt: DateTime(2026, 2, 14, 10, 30),
        libraryStatuses: {},
      );

      await tester.pumpWidget(buildSubject(entry: entry, now: now));
      expect(find.text('昨日'), findsOneWidget);
    });

    testWidgets('displays date for older entries', (tester) async {
      final now = DateTime(2026, 2, 15, 14, 0);
      final entry = SearchHistoryEntry(
        isbn: '9784003101018',
        searchedAt: DateTime(2026, 1, 5, 10, 30),
        libraryStatuses: {},
      );

      await tester.pumpWidget(buildSubject(entry: entry, now: now));
      expect(find.text('2026/01/05'), findsOneWidget);
    });

    testWidgets('displays availability status badge', (tester) async {
      final entry = SearchHistoryEntry(
        isbn: '9784003101018',
        searchedAt: DateTime(2026, 2, 15, 10, 30),
        libraryStatuses: {
          'Tokyo_Chiyoda': 'available',
          'Tokyo_Shibuya': 'checkedOut',
        },
      );

      await tester.pumpWidget(buildSubject(entry: entry));
      // Should show the best status (available)
      expect(find.text('貸出可能'), findsOneWidget);
    });

    testWidgets('calls onTap when tapped', (tester) async {
      var tapped = false;
      final entry = SearchHistoryEntry(
        isbn: '9784003101018',
        searchedAt: DateTime(2026, 2, 15, 10, 30),
        libraryStatuses: {},
      );

      await tester.pumpWidget(buildSubject(
        entry: entry,
        onTap: () => tapped = true,
      ));

      await tester.tap(find.byType(SearchHistoryCard));
      expect(tapped, isTrue);
    });
  });
}
