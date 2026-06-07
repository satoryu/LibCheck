import { describe, expect, test } from 'vitest';

import {
  AvailabilityStatus,
  aggregateAvailability,
  availabilityFromApiString,
  availabilityPriority,
  isReservable,
} from '@/domain/models/availabilityStatus';

describe('AvailabilityStatus', () => {
  describe('fromApiString', () => {
    test('maps "貸出可" to available', () => {
      expect(availabilityFromApiString('貸出可')).toBe(
        AvailabilityStatus.available,
      );
    });

    test('maps "館内のみ" to inLibraryOnly', () => {
      expect(availabilityFromApiString('館内のみ')).toBe(
        AvailabilityStatus.inLibraryOnly,
      );
    });

    test('maps "貸出中" to checkedOut', () => {
      expect(availabilityFromApiString('貸出中')).toBe(
        AvailabilityStatus.checkedOut,
      );
    });

    test('maps "蔵書なし" to notFound', () => {
      expect(availabilityFromApiString('蔵書なし')).toBe(
        AvailabilityStatus.notFound,
      );
    });

    test('maps empty string to notFound', () => {
      expect(availabilityFromApiString('')).toBe(AvailabilityStatus.notFound);
    });

    test('maps unknown string to unknown', () => {
      expect(availabilityFromApiString('不明なステータス')).toBe(
        AvailabilityStatus.unknown,
      );
    });
  });

  describe('priority', () => {
    test('available has the highest priority', () => {
      expect(availabilityPriority(AvailabilityStatus.available)).toBeGreaterThan(
        availabilityPriority(AvailabilityStatus.inLibraryOnly),
      );
    });

    test('unknown has the lowest priority', () => {
      expect(availabilityPriority(AvailabilityStatus.unknown)).toBeLessThan(
        availabilityPriority(AvailabilityStatus.error),
      );
    });
  });

  describe('isReservable', () => {
    test('returns true for available', () => {
      expect(isReservable(AvailabilityStatus.available)).toBe(true);
    });

    test('returns false for notFound', () => {
      expect(isReservable(AvailabilityStatus.notFound)).toBe(false);
    });

    test('returns false for unknown', () => {
      expect(isReservable(AvailabilityStatus.unknown)).toBe(false);
    });
  });

  describe('aggregate', () => {
    test('returns the highest priority status', () => {
      const statuses = [
        AvailabilityStatus.checkedOut,
        AvailabilityStatus.available,
        AvailabilityStatus.notFound,
      ];
      expect(aggregateAvailability(statuses)).toBe(AvailabilityStatus.available);
    });

    test('returns notFound for empty list', () => {
      expect(aggregateAvailability([])).toBe(AvailabilityStatus.notFound);
    });
  });
});
