import { beforeEach, describe, expect, it } from 'vitest';
import { PendingScanRepositoryImpl } from '@/data/repositories/pendingScanRepositoryImpl';
import type { PendingScan } from '@/domain/models/pendingScan';
import { FakeLocalStorageRepository } from '@/test/testUtils';

function createScan(args: { isbn: string; scannedAt?: Date }): PendingScan {
  return {
    isbn: args.isbn,
    scannedAt: args.scannedAt ?? new Date(2026, 7, 1, 10, 0),
  };
}

describe('PendingScanRepositoryImpl', () => {
  let fakeStorage: FakeLocalStorageRepository;
  let repository: PendingScanRepositoryImpl;

  beforeEach(() => {
    fakeStorage = new FakeLocalStorageRepository();
    repository = new PendingScanRepositoryImpl(fakeStorage);
  });

  describe('getAll', () => {
    it('returns empty list when no data stored', async () => {
      const result = await repository.getAll();
      expect(result).toHaveLength(0);
    });

    it('returns scans in scan order (oldest first)', async () => {
      await repository.add(
        createScan({ isbn: '9784003101018', scannedAt: new Date(2026, 7, 1) }),
      );
      await repository.add(
        createScan({ isbn: '9784167158057', scannedAt: new Date(2026, 7, 2) }),
      );

      const result = await repository.getAll();
      expect(result.map((s) => s.isbn)).toEqual([
        '9784003101018',
        '9784167158057',
      ]);
    });

    it('returns empty list when stored JSON is corrupted', async () => {
      await fakeStorage.setString('pending_scans', 'not valid json');
      const result = await repository.getAll();
      expect(result).toHaveLength(0);
    });

    it('skips a single corrupt entry instead of dropping the whole queue', async () => {
      await fakeStorage.setString(
        'pending_scans',
        JSON.stringify([
          { isbn: '9784003101018', scannedAt: '2026-08-01T10:00:00.000Z' },
          { scannedAt: '2026-08-01T11:00:00.000Z' },
        ]),
      );
      const result = await repository.getAll();
      expect(result.map((s) => s.isbn)).toEqual(['9784003101018']);
    });

    it('restores scannedAt as a Date across the ISO round-trip', async () => {
      const scannedAt = new Date('2026-08-01T10:00:00.000Z');
      await repository.add(createScan({ isbn: '9784003101018', scannedAt }));

      const result = await repository.getAll();
      expect(result[0].scannedAt).toEqual(scannedAt);
    });
  });

  describe('add', () => {
    it('appends a scan and returns the updated list', async () => {
      const updated = await repository.add(
        createScan({ isbn: '9784003101018' }),
      );
      expect(updated.map((s) => s.isbn)).toEqual(['9784003101018']);
    });

    it('keeps the existing entry when the same isbn is added again', async () => {
      const first = createScan({
        isbn: '9784003101018',
        scannedAt: new Date(2026, 7, 1),
      });
      const duplicate = createScan({
        isbn: '9784003101018',
        scannedAt: new Date(2026, 7, 2),
      });

      await repository.add(first);
      const updated = await repository.add(duplicate);

      expect(updated).toHaveLength(1);
      expect(updated[0].scannedAt).toEqual(first.scannedAt);
    });
  });

  describe('remove', () => {
    it('removes the scan with the given isbn and returns the updated list', async () => {
      await repository.add(createScan({ isbn: '9784003101018' }));
      await repository.add(createScan({ isbn: '9784167158057' }));

      const updated = await repository.remove('9784003101018');
      expect(updated.map((s) => s.isbn)).toEqual(['9784167158057']);

      const persisted = await repository.getAll();
      expect(persisted.map((s) => s.isbn)).toEqual(['9784167158057']);
    });

    it('returns the list unchanged when the isbn is not queued', async () => {
      await repository.add(createScan({ isbn: '9784003101018' }));
      const updated = await repository.remove('9999999999999');
      expect(updated.map((s) => s.isbn)).toEqual(['9784003101018']);
    });
  });
});
