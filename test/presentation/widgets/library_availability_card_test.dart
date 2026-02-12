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

    testWidgets('displays availability status badge', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          libKeyStatuses: {},
        ),
      ));

      expect(find.byType(AvailabilityStatusBadge), findsOneWidget);
      expect(find.text('貸出可能'), findsOneWidget);
    });

    testWidgets('displays checkedOut status', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.checkedOut,
          libKeyStatuses: {},
        ),
      ));

      expect(find.text('貸出中'), findsOneWidget);
    });

    testWidgets('displays notFound status', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.notFound,
          libKeyStatuses: {},
        ),
      ));

      expect(find.text('蔵書なし'), findsOneWidget);
    });

    testWidgets('displays reserve URL link when available', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          reserveUrl: 'https://example.com/reserve',
          libKeyStatuses: {},
        ),
      ));

      expect(find.text('予約する'), findsOneWidget);
    });

    testWidgets('does not display reserve URL link when null', (tester) async {
      await tester.pumpWidget(buildSubject(
        status: const LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          libKeyStatuses: {},
        ),
      ));

      expect(find.text('予約する'), findsNothing);
    });
  });
}
