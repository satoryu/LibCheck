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
  });
}
