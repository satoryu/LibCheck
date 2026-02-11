import 'package:flutter_test/flutter_test.dart';

import 'package:libcheck/domain/models/availability_status.dart';

void main() {
  group('AvailabilityStatus', () {
    group('fromApiString', () {
      test('maps "貸出可" to available', () {
        expect(AvailabilityStatus.fromApiString('貸出可'),
            AvailabilityStatus.available);
      });

      test('maps "蔵書あり" to available', () {
        expect(AvailabilityStatus.fromApiString('蔵書あり'),
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

      test('maps "予約中" to reserved', () {
        expect(AvailabilityStatus.fromApiString('予約中'),
            AvailabilityStatus.reserved);
      });

      test('maps "準備中" to preparing', () {
        expect(AvailabilityStatus.fromApiString('準備中'),
            AvailabilityStatus.preparing);
      });

      test('maps "休館中" to closed', () {
        expect(AvailabilityStatus.fromApiString('休館中'),
            AvailabilityStatus.closed);
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

      test('inLibraryOnly has higher priority than checkedOut', () {
        expect(AvailabilityStatus.inLibraryOnly.priority,
            greaterThan(AvailabilityStatus.checkedOut.priority));
      });

      test('notFound has lower priority than checkedOut', () {
        expect(AvailabilityStatus.notFound.priority,
            lessThan(AvailabilityStatus.checkedOut.priority));
      });

      test('unknown has the lowest priority', () {
        expect(AvailabilityStatus.unknown.priority,
            lessThan(AvailabilityStatus.error.priority));
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

      test('returns the single status for single-element list', () {
        expect(AvailabilityStatus.aggregate([AvailabilityStatus.checkedOut]),
            AvailabilityStatus.checkedOut);
      });
    });
  });
}
