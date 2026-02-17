import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/availability_status.dart';
import 'package:libcheck/domain/models/library.dart';
import 'package:libcheck/domain/models/library_status.dart';
import 'package:libcheck/presentation/widgets/availability_status_badge.dart';
import 'package:libcheck/presentation/widgets/library_availability_card.dart';

const _library = Library(
  systemId: 'Tokyo_Minato',
  systemName: '港区図書館',
  libKey: 'みなと',
  libId: '123',
  shortName: 'みなと図書館',
  formalName: '港区立みなと図書館',
  address: '東京都港区芝公園3-2-25',
  pref: '東京都',
  city: '港区',
  category: 'MEDIUM',
);

void main() {
  group('LibraryAvailabilityCard', () {
    Widget buildSubject({
      Library library = _library,
      required LibraryStatus status,
    }) {
      return MaterialApp(
        home: Scaffold(
          body: LibraryAvailabilityCard(library: library, status: status),
        ),
      );
    }

    testWidgets('displays library name', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          libKeyStatuses: {},
        ),
      ));

      expect(find.text('港区立みなと図書館'), findsOneWidget);
    });

    testWidgets('displays library location', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          libKeyStatuses: {},
        ),
      ));

      expect(find.text('東京都港区'), findsOneWidget);
    });

    testWidgets('displays availability status badge based on libKey', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          libKeyStatuses: {'みなと': '貸出可'},
        ),
      ));

      expect(find.byType(AvailabilityStatusBadge), findsOneWidget);
      expect(find.text('貸出可能'), findsOneWidget);
    });

    testWidgets('displays checkedOut status based on libKey', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          libKeyStatuses: {'みなと': '貸出中'},
        ),
      ));

      expect(find.text('貸出中'), findsOneWidget);
    });

    testWidgets('displays notFound status when libKey is not in statuses', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          libKeyStatuses: {},
        ),
      ));

      expect(find.text('蔵書なし'), findsOneWidget);
    });

    testWidgets('displays per-libKey status, not aggregated system status', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          libKeyStatuses: {'みなと': '貸出中', 'しば': '貸出可'},
        ),
      ));

      // The library's libKey is 'みなと', which is '貸出中'
      // Even though system status is 'available', the card should show '貸出中'
      expect(find.text('貸出中'), findsOneWidget);
    });

    testWidgets('displays reserve URL link when reservable status', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          reserveUrl: 'https://example.com/reserve',
          libKeyStatuses: {'みなと': '貸出可'},
        ),
      ));

      expect(find.text('予約する'), findsOneWidget);
    });

    testWidgets('does not display reserve URL link when null', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          libKeyStatuses: {'みなと': '貸出可'},
        ),
      ));

      expect(find.text('予約する'), findsNothing);
    });

    testWidgets('does not display reserve URL link when empty string', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          reserveUrl: '',
          libKeyStatuses: {'みなと': '貸出可'},
        ),
      ));

      expect(find.text('予約する'), findsNothing);
    });

    testWidgets('does not display reserve URL link when notFound status', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          reserveUrl: 'https://example.com/reserve',
          libKeyStatuses: {},
        ),
      ));

      // libKey 'みなと' is not in libKeyStatuses, so status is notFound
      expect(find.text('予約する'), findsNothing);
    });

    testWidgets('does not display reserve URL link when closed status', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          reserveUrl: 'https://example.com/reserve',
          libKeyStatuses: {'みなと': '休館中'},
        ),
      ));

      expect(find.text('予約する'), findsNothing);
    });

    testWidgets('displays reserve URL link when checkedOut status', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          reserveUrl: 'https://example.com/reserve',
          libKeyStatuses: {'みなと': '貸出中'},
        ),
      ));

      expect(find.text('予約する'), findsOneWidget);
    });

    testWidgets('does not display reserve URL link when URL has javascript scheme', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          reserveUrl: 'javascript:alert(1)',
          libKeyStatuses: {'みなと': '貸出可'},
        ),
      ));

      expect(find.text('予約する'), findsNothing);
    });

    testWidgets('does not display reserve URL link when URL has file scheme', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          reserveUrl: 'file:///etc/passwd',
          libKeyStatuses: {'みなと': '貸出可'},
        ),
      ));

      expect(find.text('予約する'), findsNothing);
    });

    testWidgets('does not display reserve URL link when URL has data scheme', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          reserveUrl: 'data:text/html,<script>alert(1)</script>',
          libKeyStatuses: {'みなと': '貸出可'},
        ),
      ));

      expect(find.text('予約する'), findsNothing);
    });

    testWidgets('displays reserve URL link when URL has http scheme', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          reserveUrl: 'http://example.com/reserve',
          libKeyStatuses: {'みなと': '貸出可'},
        ),
      ));

      expect(find.text('予約する'), findsOneWidget);
    });
  });
}
