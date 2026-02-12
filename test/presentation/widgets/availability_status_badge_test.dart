import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/availability_status.dart';
import 'package:libcheck/presentation/widgets/availability_status_badge.dart';

void main() {
  group('AvailabilityStatusBadge', () {
    Widget buildSubject(AvailabilityStatus status) {
      return MaterialApp(
        home: Scaffold(
          body: AvailabilityStatusBadge(status: status),
        ),
      );
    }

    testWidgets('shows "貸出可能" with green for available status',
        (tester) async {
      await tester.pumpWidget(buildSubject(AvailabilityStatus.available));

      expect(find.text('貸出可能'), findsOneWidget);
      final icon = tester.widget<Icon>(find.byType(Icon));
      expect(icon.color, const Color(0xFF2E7D32));
    });

    testWidgets('shows "館内のみ" with green for inLibraryOnly status',
        (tester) async {
      await tester.pumpWidget(buildSubject(AvailabilityStatus.inLibraryOnly));

      expect(find.text('館内のみ'), findsOneWidget);
      final icon = tester.widget<Icon>(find.byType(Icon));
      expect(icon.color, const Color(0xFF2E7D32));
    });

    testWidgets('shows "貸出中" with orange for checkedOut status',
        (tester) async {
      await tester.pumpWidget(buildSubject(AvailabilityStatus.checkedOut));

      expect(find.text('貸出中'), findsOneWidget);
      final icon = tester.widget<Icon>(find.byType(Icon));
      expect(icon.color, const Color(0xFFEF6C00));
    });

    testWidgets('shows "予約中" with orange for reserved status',
        (tester) async {
      await tester.pumpWidget(buildSubject(AvailabilityStatus.reserved));

      expect(find.text('予約中'), findsOneWidget);
      final icon = tester.widget<Icon>(find.byType(Icon));
      expect(icon.color, const Color(0xFFEF6C00));
    });

    testWidgets('shows "蔵書なし" with gray for notFound status',
        (tester) async {
      await tester.pumpWidget(buildSubject(AvailabilityStatus.notFound));

      expect(find.text('蔵書なし'), findsOneWidget);
      final icon = tester.widget<Icon>(find.byType(Icon));
      expect(icon.color, const Color(0xFF9E9E9E));
    });

    testWidgets('shows "エラー" with red for error status', (tester) async {
      await tester.pumpWidget(buildSubject(AvailabilityStatus.error));

      expect(find.text('エラー'), findsOneWidget);
      final icon = tester.widget<Icon>(find.byType(Icon));
      expect(icon.color, const Color(0xFFD32F2F));
    });

    testWidgets('shows "不明" with gray for unknown status', (tester) async {
      await tester.pumpWidget(buildSubject(AvailabilityStatus.unknown));

      expect(find.text('不明'), findsOneWidget);
      final icon = tester.widget<Icon>(find.byType(Icon));
      expect(icon.color, const Color(0xFF9E9E9E));
    });
  });
}
