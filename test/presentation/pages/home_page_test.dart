import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:libcheck/presentation/pages/home_page.dart';
import 'package:libcheck/presentation/providers/app_providers.dart';

void main() {
  group('HomePage', () {
    testWidgets('renders AppBar with title from appTitleProvider',
        (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: HomePage(),
          ),
        ),
      );

      expect(find.byType(AppBar), findsOneWidget);
      expect(find.text('LibCheck'), findsOneWidget);
    });

    testWidgets('renders Scaffold', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: HomePage(),
          ),
        ),
      );

      expect(find.byType(Scaffold), findsOneWidget);
    });

    testWidgets('displays overridden title when provider is overridden',
        (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            appTitleProvider.overrideWithValue('Test App'),
          ],
          child: const MaterialApp(
            home: HomePage(),
          ),
        ),
      );

      expect(find.text('Test App'), findsOneWidget);
      expect(find.text('LibCheck'), findsNothing);
    });

    testWidgets('displays welcome icon and description', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: HomePage(),
          ),
        ),
      );

      expect(find.byIcon(Icons.menu_book), findsOneWidget);
      expect(find.textContaining('図書館の蔵書'), findsOneWidget);
    });

    testWidgets('バーコードスキャンボタンが表示される', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: HomePage(),
          ),
        ),
      );

      expect(find.text('バーコードでスキャン'), findsOneWidget);
      expect(find.byIcon(Icons.qr_code_scanner), findsOneWidget);
    });

    testWidgets('ISBN手動入力ボタンが表示される', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: HomePage(),
          ),
        ),
      );

      expect(find.text('ISBNを入力'), findsOneWidget);
      expect(find.byIcon(Icons.keyboard), findsOneWidget);
    });

    testWidgets('バーコードスキャンボタンで/scanへ遷移する', (tester) async {
      final router = GoRouter(
        initialLocation: '/',
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const HomePage(),
          ),
          GoRoute(
            path: '/scan',
            builder: (context, state) => Scaffold(
              appBar: AppBar(title: const Text('バーコードスキャン')),
            ),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('バーコードでスキャン'));
      await tester.pumpAndSettle();

      expect(find.text('バーコードスキャン'), findsOneWidget);
    });

    testWidgets('ISBN手動入力ボタンで/isbn-inputへ遷移する', (tester) async {
      final router = GoRouter(
        initialLocation: '/',
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const HomePage(),
          ),
          GoRoute(
            path: '/isbn-input',
            builder: (context, state) => Scaffold(
              appBar: AppBar(title: const Text('ISBN入力')),
            ),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('ISBNを入力'));
      await tester.pumpAndSettle();

      expect(find.text('ISBN入力'), findsOneWidget);
    });
  });
}
