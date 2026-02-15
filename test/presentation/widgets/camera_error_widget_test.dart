import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:libcheck/presentation/widgets/camera_error_widget.dart';

void main() {
  group('CameraErrorWidget', () {
    testWidgets('エラーメッセージが表示される', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CameraErrorWidget(
              onRetry: () {},
              onManualInput: () {},
            ),
          ),
        ),
      );

      expect(find.text('カメラの起動に失敗しました'), findsOneWidget);
    });

    testWidgets('エラーアイコンが表示される', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CameraErrorWidget(
              onRetry: () {},
              onManualInput: () {},
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.videocam_off_outlined), findsOneWidget);
    });

    testWidgets('「再試行」ボタンが表示される', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CameraErrorWidget(
              onRetry: () {},
              onManualInput: () {},
            ),
          ),
        ),
      );

      expect(find.text('再試行'), findsOneWidget);
    });

    testWidgets('「ISBNを手動入力する」ボタンが表示される', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CameraErrorWidget(
              onRetry: () {},
              onManualInput: () {},
            ),
          ),
        ),
      );

      expect(find.text('ISBNを手動入力する'), findsOneWidget);
    });

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
