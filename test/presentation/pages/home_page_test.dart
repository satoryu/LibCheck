import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/presentation/pages/home_page.dart';
import 'package:libcheck/presentation/providers/app_providers.dart';

void main() {
  group('HomePage', () {
    testWidgets('renders AppBar with title from appTitleProvider', (tester) async {
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

    testWidgets('displays overridden title when provider is overridden', (tester) async {
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
  });
}
