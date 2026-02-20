import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/availability_status.dart';

void main() {
  group('AvailabilityStatus', () {
    group('fromApiString', () {
      test('maps "貸出可" to available', () {
        expect(AvailabilityStatus.fromApiString('貸出可'),
            AvailabilityStatus.available);
      });

      test('maps "館内のみ" to inLibraryOnly', () {
        expect(AvailabilityStatus.fromApiString('館内のみ'),
            AvailabilityStatus.inLibraryOnly);
      });

      test('maps "貸出中" to checkedOut', () {
        expect(AvailabilityStatus.fromApiString('貸出中'),
            AvailabilityStatus.checkedOut);
      });

      test('maps "蔵書なし" to notFound', () {
        expect(AvailabilityStatus.fromApiString('蔵書なし'),
            AvailabilityStatus.notFound);
      });

      test('maps empty string to notFound', () {
        expect(
            AvailabilityStatus.fromApiString(''), AvailabilityStatus.notFound);
      });

      test('maps unknown string to unknown', () {
        expect(AvailabilityStatus.fromApiString('不明なステータス'),
            AvailabilityStatus.unknown);
      });
    });

    group('priority', () {
      test('available has the highest priority', () {
        expect(AvailabilityStatus.available.priority,
            greaterThan(AvailabilityStatus.inLibraryOnly.priority));
      });

      test('unknown has the lowest priority', () {
        expect(AvailabilityStatus.unknown.priority,
            lessThan(AvailabilityStatus.error.priority));
      });
    });

    group('isReservable', () {
      test('returns true for available', () {
        expect(AvailabilityStatus.available.isReservable, isTrue);
      });

      test('returns false for notFound', () {
        expect(AvailabilityStatus.notFound.isReservable, isFalse);
      });

      test('returns false for unknown', () {
        expect(AvailabilityStatus.unknown.isReservable, isFalse);
      });
    });

    group('aggregate', () {
      test('returns the highest priority status', () {
        final statuses = [
          AvailabilityStatus.checkedOut,
          AvailabilityStatus.available,
          AvailabilityStatus.notFound,
        ];
        expect(AvailabilityStatus.aggregate(statuses),
            AvailabilityStatus.available);
      });

      test('returns notFound for empty list', () {
        expect(AvailabilityStatus.aggregate([]), AvailabilityStatus.notFound);
      });
    });
  });
}
