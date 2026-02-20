import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/data/exceptions/calil_api_exception.dart';
import 'package:libcheck/presentation/widgets/error_state_widget.dart';

void main() {
  group('ErrorStateWidget', () {
    Widget buildSubject({
      required Object error,
      VoidCallback? onRetry,
    }) {
      return MaterialApp(
        home: Scaffold(
          body: ErrorStateWidget(
            error: error,
            onRetry: onRetry ?? () {},
          ),
        ),
      );
    }

    testWidgets('displays user-friendly message for network error',
        (tester) async {
      await tester.pumpWidget(buildSubject(
        error: const CalilNetworkException('Connection refused'),
      ));

      expect(find.text('インターネット接続を確認してください'), findsOneWidget);
    });

    testWidgets('displays user-friendly message for timeout error',
        (tester) async {
      await tester.pumpWidget(buildSubject(
        error: const CalilTimeoutException('Polling timeout'),
      ));

      expect(find.text('応答に時間がかかっています。再度お試しください'), findsOneWidget);
    });

    testWidgets('calls onRetry when retry button is tapped', (tester) async {
      var retried = false;

      await tester.pumpWidget(buildSubject(
        error: Exception('test'),
        onRetry: () => retried = true,
      ));

      await tester.tap(find.text('再試行'));
      expect(retried, isTrue);
    });
  });
}
