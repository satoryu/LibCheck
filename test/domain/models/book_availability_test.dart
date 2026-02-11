import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/availability_status.dart';
import 'package:libcheck/domain/models/book_availability.dart';
import 'package:libcheck/domain/models/library_status.dart';

void main() {
  group('BookAvailability', () {
    test('creates instance with isbn and library statuses', () {
      const availability = BookAvailability(
        isbn: '9784774142230',
        libraryStatuses: {
          'Tokyo_Minato': LibraryStatus(
            systemId: 'Tokyo_Minato',
            status: AvailabilityStatus.available,
            libKeyStatuses: {'みなと': '貸出可'},
          ),
        },
      );

      expect(availability.isbn, '9784774142230');
      expect(availability.libraryStatuses, hasLength(1));
      expect(availability.libraryStatuses['Tokyo_Minato']?.status,
          AvailabilityStatus.available);
    });

    test('supports multiple library systems', () {
      const availability = BookAvailability(
        isbn: '9784774142230',
        libraryStatuses: {
          'Tokyo_Minato': LibraryStatus(
            systemId: 'Tokyo_Minato',
            status: AvailabilityStatus.available,
            libKeyStatuses: {'みなと': '貸出可'},
          ),
          'Tokyo_Shibuya': LibraryStatus(
            systemId: 'Tokyo_Shibuya',
            status: AvailabilityStatus.checkedOut,
            libKeyStatuses: {'しぶや': '貸出中'},
          ),
        },
      );

      expect(availability.libraryStatuses, hasLength(2));
    });
  });
}
