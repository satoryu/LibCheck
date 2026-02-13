import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/availability_status.dart';
import 'package:libcheck/domain/models/library_status.dart';

void main() {
  group('LibraryStatus', () {
    test('creates instance with required fields', () {
      const status = LibraryStatus(
        systemId: 'Tokyo_Minato',
        status: AvailabilityStatus.available,
        libKeyStatuses: {'みなと': '貸出可'},
      );

      expect(status.systemId, 'Tokyo_Minato');
      expect(status.status, AvailabilityStatus.available);
      expect(status.reserveUrl, isNull);
      expect(status.libKeyStatuses, {'みなと': '貸出可'});
    });

    test('creates instance with reserveUrl', () {
      const status = LibraryStatus(
        systemId: 'Tokyo_Minato',
        status: AvailabilityStatus.checkedOut,
        reserveUrl: 'https://example.com/reserve',
        libKeyStatuses: {'みなと': '貸出中'},
      );

      expect(status.reserveUrl, 'https://example.com/reserve');
    });

    group('statusForLibKey', () {
      test('returns correct status for existing libKey', () {
        const status = LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          libKeyStatuses: {'みなと': '貸出可'},
        );

        expect(
          status.statusForLibKey('みなと'),
          AvailabilityStatus.available,
        );
      });

      test('returns notFound for non-existing libKey', () {
        const status = LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          libKeyStatuses: {'みなと': '貸出可'},
        );

        expect(
          status.statusForLibKey('しば'),
          AvailabilityStatus.notFound,
        );
      });

      test('returns correct status for each libKey when multiple exist', () {
        const status = LibraryStatus(
          systemId: 'Tokyo_Minato',
          status: AvailabilityStatus.available,
          libKeyStatuses: {
            'みなと': '貸出可',
            'しば': '貸出中',
            'あかさか': '蔵書なし',
          },
        );

        expect(
          status.statusForLibKey('みなと'),
          AvailabilityStatus.available,
        );
        expect(
          status.statusForLibKey('しば'),
          AvailabilityStatus.checkedOut,
        );
        expect(
          status.statusForLibKey('あかさか'),
          AvailabilityStatus.notFound,
        );
      });
    });
  });
}
