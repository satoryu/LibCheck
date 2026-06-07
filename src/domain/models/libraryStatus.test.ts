import { describe, expect, test } from 'vitest';

import { AvailabilityStatus } from '@/domain/models/availabilityStatus';
import { LibraryStatus, statusForLibKey } from '@/domain/models/libraryStatus';

describe('LibraryStatus', () => {
  describe('statusForLibKey', () => {
    test('returns correct status for existing libKey', () => {
      const status: LibraryStatus = {
        systemId: 'Tokyo_Minato',
        status: AvailabilityStatus.available,
        libKeyStatuses: { みなと: '貸出可' },
      };

      expect(statusForLibKey(status, 'みなと')).toBe(
        AvailabilityStatus.available,
      );
    });

    test('returns notFound for non-existing libKey', () => {
      const status: LibraryStatus = {
        systemId: 'Tokyo_Minato',
        status: AvailabilityStatus.available,
        libKeyStatuses: { みなと: '貸出可' },
      };

      expect(statusForLibKey(status, 'しば')).toBe(AvailabilityStatus.notFound);
    });
  });
});
