import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/app.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const LibCheckApp());

    expect(find.text('LibCheck'), findsOneWidget);
  });
}
