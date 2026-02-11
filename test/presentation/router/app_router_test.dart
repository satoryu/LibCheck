import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:libcheck/presentation/router/app_router.dart';

void main() {
  group('AppRouter', () {
    test('routerProvider returns a GoRouter instance', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final router = container.read(routerProvider);
      expect(router, isA<GoRouter>());
    });

    testWidgets('navigates to home page at /', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final router = container.read(routerProvider);

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('LibCheck'), findsOneWidget);
    });

    testWidgets('navigates to prefecture selection page at /library/add',
        (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final router = container.read(routerProvider);

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );
      await tester.pumpAndSettle();

      router.go('/library/add');
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, '都道府県を選択'), findsOneWidget);
    });

    testWidgets('navigates to city selection page at /library/add/:pref',
        (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final router = container.read(routerProvider);

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );
      await tester.pumpAndSettle();

      router.go('/library/add/東京都');
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, '東京都の市区町村'), findsOneWidget);
    });

    testWidgets(
        'navigates to library list placeholder at /library/add/:pref/:city',
        (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final router = container.read(routerProvider);

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );
      await tester.pumpAndSettle();

      router.go('/library/add/東京都/港区');
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, '港区の図書館'), findsOneWidget);
    });
  });
}
