import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/app.dart';

void main() {
  group('LibCheckApp', () {
    testWidgets('renders MaterialApp with correct title', (tester) async {
      await tester.pumpWidget(const LibCheckApp());

      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));
      expect(materialApp.title, 'LibCheck');
    });

    testWidgets('displays HomePage as home', (tester) async {
      await tester.pumpWidget(const LibCheckApp());

      expect(find.text('LibCheck'), findsOneWidget);
    });
  });
}
