import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:libcheck/presentation/widgets/camera_permission_error_widget.dart';

void main() {
  group('CameraPermissionErrorWidget', () {
    testWidgets('「設定を開く」ボタンをタップするとコールバックが呼ばれる', (tester) async {
      var called = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CameraPermissionErrorWidget(
              onOpenSettings: () => called = true,
              onManualInput: () {},
            ),
          ),
        ),
      );

      await tester.tap(find.text('設定を開く'));
      expect(called, isTrue);
    });

    testWidgets('「ISBNを手動入力する」ボタンをタップするとコールバックが呼ばれる',
        (tester) async {
      var called = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CameraPermissionErrorWidget(
              onOpenSettings: () {},
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
