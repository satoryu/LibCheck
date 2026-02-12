import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:libcheck/presentation/widgets/scan_overlay_widget.dart';

void main() {
  group('ScanOverlayWidget', () {
    testWidgets('ウィジェットが正しくレンダリングされる', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ScanOverlayWidget(),
          ),
        ),
      );

      // ScanOverlayWidget が存在する
      expect(find.byType(ScanOverlayWidget), findsOneWidget);
    });

    testWidgets('ヘルプテキストが表示される', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ScanOverlayWidget(),
          ),
        ),
      );

      expect(find.text('バーコードをガイド枠に合わせてください'), findsOneWidget);
    });

    testWidgets('CustomPaint が含まれる', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ScanOverlayWidget(),
          ),
        ),
      );

      expect(find.byType(CustomPaint), findsWidgets);
    });
  });
}
