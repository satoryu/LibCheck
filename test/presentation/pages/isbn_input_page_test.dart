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

    testWidgets('説明テキストが表示される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('ISBNを入力してください'), findsOneWidget);
    });

    testWidgets('ISBN入力フィールドが表示される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      expect(find.byType(TextField), findsOneWidget);
    });

    testWidgets('ヒントテキストが表示される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      expect(
        find.text('書籍の裏表紙に記載されている13桁の数字を入力してください。'),
        findsOneWidget,
      );
    });

    testWidgets('検索ボタンが表示される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('検索する'), findsOneWidget);
    });

    testWidgets('バーコードスキャンボタンが表示される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('バーコードスキャンへ'), findsOneWidget);
    });

    testWidgets('初期状態で検索ボタンが無効', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      final button = tester.widget<FilledButton>(find.widgetWithText(FilledButton, '検索する'));
      expect(button.onPressed, isNull);
    });

    testWidgets('入力途中ではエラーメッセージが表示されない', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '978410');
      await tester.pump();

      expect(find.text('有効なISBNです'), findsNothing);
      expect(find.textContaining('チェックディジット'), findsNothing);
    });

    testWidgets('入力途中では検索ボタンが無効のまま', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '978410');
      await tester.pump();

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

    testWidgets('有効なISBN-10入力時に「有効なISBNです」と表示される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '4873117585');
      await tester.pump();

      expect(find.text('有効なISBNです'), findsOneWidget);
    });

    testWidgets('無効なISBN入力時にエラーメッセージが表示される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '9784873117585');
      await tester.pump();

      expect(find.text('ISBN-13 のチェックディジットが正しくありません'), findsOneWidget);
    });

    testWidgets('無効なISBN入力時に検索ボタンが無効', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '9784873117585');
      await tester.pump();

      final button = tester.widget<FilledButton>(find.widgetWithText(FilledButton, '検索する'));
      expect(button.onPressed, isNull);
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

    testWidgets('ハイフン付きISBN入力でも正しく動作する', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '978-4-87311-758-4');
      await tester.pump();

      expect(find.text('有効なISBNです'), findsOneWidget);
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

    testWidgets('11桁入力時に桁数エラーメッセージが表示される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '97848731175');
      await tester.pump();

      expect(find.text('ISBNは10桁または13桁で入力してください'), findsOneWidget);
    });

    testWidgets('12桁入力時に桁数エラーメッセージが表示される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '978487311758');
      await tester.pump();

      expect(find.text('ISBNは10桁または13桁で入力してください'), findsOneWidget);
    });

    testWidgets('ISBN-10のXチェックディジットが有効として認識される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      // 080442957X: check digit X (=10), valid ISBN-10
      await tester.enterText(find.byType(TextField), '080442957X');
      await tester.pump();

      expect(find.text('有効なISBNです'), findsOneWidget);
      final button = tester.widget<FilledButton>(find.widgetWithText(FilledButton, '検索する'));
      expect(button.onPressed, isNotNull);
    });

    testWidgets('978以外で始まるISBN-13はエラーメッセージが表示される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '1234567890123');
      await tester.pump();

      expect(find.text('ISBN-13 は 978 または 979 で始まる必要があります'), findsOneWidget);
    });

    testWidgets('無効なISBN-10入力時にエラーメッセージが表示される', (tester) async {
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '4873117586');
      await tester.pump();

      expect(find.text('ISBN-10 のチェックディジットが正しくありません'), findsOneWidget);
    });
  });
}
