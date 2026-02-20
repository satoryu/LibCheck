import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:libcheck/presentation/pages/home_page.dart';

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
