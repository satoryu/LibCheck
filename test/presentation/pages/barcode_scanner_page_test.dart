import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:libcheck/presentation/pages/barcode_scanner_page.dart';

void main() {
  group('BarcodeScannerPage', () {
    late GoRouter router;

    setUp(() {
      router = GoRouter(
        initialLocation: '/scan',
        routes: [
          GoRoute(
            path: '/scan',
            builder: (context, state) => const BarcodeScannerPage(),
          ),
          GoRoute(
            path: '/result/:isbn',
            builder: (context, state) => Scaffold(
              body: Text('Result: ${state.pathParameters['isbn']}'),
            ),
          ),
          GoRoute(
            path: '/isbn-input',
            builder: (context, state) => Scaffold(
              appBar: AppBar(title: const Text('ISBN入力')),
            ),
          ),
        ],
      );
    });

    Widget createTestWidget() {
      return ProviderScope(
        child: MaterialApp.router(
          routerConfig: router,
        ),
      );
    }

    testWidgets('AppBarに「バーコードスキャン」タイトルが表示される', (tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('バーコードスキャン'), findsOneWidget);
    });

    testWidgets('「ISBNを手動入力する」ボタンタップで/isbn-inputへ遷移する', (tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      await tester.tap(find.text('ISBNを手動入力する'));
      await tester.pumpAndSettle();

      expect(find.text('ISBN入力'), findsOneWidget);
    });
  });
}
