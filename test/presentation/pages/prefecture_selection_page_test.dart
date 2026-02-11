import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/presentation/pages/prefecture_selection_page.dart';

void main() {
  group('PrefectureSelectionPage', () {
    Widget buildSubject() {
      return const ProviderScope(
        child: MaterialApp(
          home: PrefectureSelectionPage(),
        ),
      );
    }

    testWidgets('renders AppBar with title', (tester) async {
      await tester.pumpWidget(buildSubject());

      expect(find.widgetWithText(AppBar, '都道府県を選択'), findsOneWidget);
    });

    testWidgets('displays region group headers', (tester) async {
      await tester.pumpWidget(buildSubject());

      expect(find.text('北海道・東北'), findsOneWidget);
      expect(find.text('関東'), findsOneWidget);
    });

    testWidgets('displays prefectures under their region groups',
        (tester) async {
      await tester.pumpWidget(buildSubject());

      expect(find.text('北海道'), findsOneWidget);
      expect(find.text('青森県'), findsOneWidget);
      expect(find.text('東京都'), findsOneWidget);
    });

    testWidgets('displays search field', (tester) async {
      await tester.pumpWidget(buildSubject());

      expect(find.byType(TextField), findsOneWidget);
    });

    testWidgets('filters prefectures by search text', (tester) async {
      await tester.pumpWidget(buildSubject());

      await tester.enterText(find.byType(TextField), '東京');
      await tester.pump();

      expect(find.text('東京都'), findsOneWidget);
      expect(find.text('北海道'), findsNothing);
      expect(find.text('大阪府'), findsNothing);
    });

    testWidgets('shows all prefectures when search is cleared', (tester) async {
      await tester.pumpWidget(buildSubject());

      await tester.enterText(find.byType(TextField), '東京');
      await tester.pump();
      expect(find.text('北海道'), findsNothing);

      await tester.enterText(find.byType(TextField), '');
      await tester.pump();
      expect(find.text('北海道'), findsOneWidget);
    });

    testWidgets('hides region headers with no matching prefectures',
        (tester) async {
      await tester.pumpWidget(buildSubject());

      await tester.enterText(find.byType(TextField), '東京');
      await tester.pump();

      expect(find.text('関東'), findsOneWidget);
      expect(find.text('北海道・東北'), findsNothing);
    });
  });
}
