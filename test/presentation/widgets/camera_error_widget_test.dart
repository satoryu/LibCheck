import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:libcheck/presentation/widgets/camera_error_widget.dart';

void main() {
  group('CameraErrorWidget', () {
    testWidgets('「再試行」ボタンをタップするとonRetryが呼ばれる', (tester) async {
      var called = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CameraErrorWidget(
              onRetry: () => called = true,
              onManualInput: () {},
            ),
          ),
        ),
      );

      await tester.tap(find.text('再試行'));
      expect(called, isTrue);
    });

    testWidgets('「ISBNを手動入力する」ボタンをタップするとonManualInputが呼ばれる',
        (tester) async {
      var called = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CameraErrorWidget(
              onRetry: () {},
              onManualInput: () => called = true,
            ),
          ),
        ),
      );

      await tester.tap(find.text('ISBNを手動入力する'));
      expect(called, isTrue);
    });
  });
}
