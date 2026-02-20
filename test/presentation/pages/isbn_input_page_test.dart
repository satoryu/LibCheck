import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:libcheck/presentation/pages/isbn_input_page.dart';

void main() {
  group('IsbnInputPage', () {
    late GoRouter router;

    setUp(() {
      router = GoRouter(
        initialLocation: '/isbn-input',
        routes: [
          GoRoute(
            path: '/isbn-input',
            builder: (context, state) => const IsbnInputPage(),
          ),
          GoRoute(
            path: '/result/:isbn',
            builder: (context, state) => Scaffold(
              appBar: AppBar(title: const Text('検索結果')),
              body: Text('ISBN: ${state.pathParameters['isbn']}'),
            ),
          ),
          GoRoute(
            path: '/scan',
            builder: (context, state) => Scaffold(
              appBar: AppBar(title: const Text('バーコードスキャン')),
            ),
          ),
        ],
      );
    });

    Widget buildTestWidget() {
      return ProviderScope(
        child: MaterialApp.router(
          routerConfig: router,
        ),
      );
    }

    testWidgets('AppBarに「ISBN入力」と表示される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, 'ISBN入力'), findsOneWidget);
    });

    testWidgets('初期状態で検索ボタンが無効', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      final button = tester.widget<FilledButton>(find.widgetWithText(FilledButton, '検索する'));
      expect(button.onPressed, isNull);
    });

    testWidgets('有効なISBN-13入力時に「有効なISBNです」と表示される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '9784873117584');
      await tester.pump();

      expect(find.text('有効なISBNです'), findsOneWidget);
    });

    testWidgets('有効なISBN-13入力時に検索ボタンが有効になる', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '9784873117584');
      await tester.pump();

      final button = tester.widget<FilledButton>(find.widgetWithText(FilledButton, '検索する'));
      expect(button.onPressed, isNotNull);
    });

    testWidgets('無効なISBN入力時にエラーメッセージが表示される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '9784873117585');
      await tester.pump();

      expect(find.text('ISBN-13 のチェックディジットが正しくありません'), findsOneWidget);
    });

    testWidgets('有効なISBN入力後に検索ボタンで/result/:isbnへ遷移する', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '9784873117584');
      await tester.pump();

      await tester.tap(find.text('検索する'));
      await tester.pumpAndSettle();

      expect(find.text('検索結果'), findsOneWidget);
      expect(find.text('ISBN: 9784873117584'), findsOneWidget);
    });

    testWidgets('バーコードスキャンボタンで/scanへ遷移する', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.tap(find.text('バーコードスキャンへ'));
      await tester.pumpAndSettle();

      expect(find.text('バーコードスキャン'), findsOneWidget);
    });

    testWidgets('ハイフン付きISBN入力後の遷移でハイフンが除去される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '978-4-87311-758-4');
      await tester.pump();

      await tester.tap(find.text('検索する'));
      await tester.pumpAndSettle();

      expect(find.text('ISBN: 9784873117584'), findsOneWidget);
    });
  });
}
