import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/availability_status.dart';
import 'package:libcheck/domain/models/library_status.dart';

void main() {
  group('LibraryStatus', () {
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
    });
  });
}
