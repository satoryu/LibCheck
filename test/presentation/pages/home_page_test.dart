import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/presentation/pages/home_page.dart';

void main() {
  group('HomePage', () {
    testWidgets('renders AppBar with LibCheck title', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: HomePage(),
        ),
      );

      expect(find.byType(AppBar), findsOneWidget);
      expect(find.text('LibCheck'), findsOneWidget);
    });

    testWidgets('renders Scaffold', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: HomePage(),
        ),
      );

      expect(find.byType(Scaffold), findsOneWidget);
    });
  });
}
