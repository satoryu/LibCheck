import { describe, expect, it } from 'vitest';
import {
  pendingScanFromJson,
  pendingScanToJson,
} from '@/domain/models/pendingScan';

describe('pendingScanFromJson', () => {
  it('parses isbn and scannedAt from JSON', () => {
    const scan = pendingScanFromJson({
      isbn: '9784003101018',
      scannedAt: '2026-08-01T10:00:00.000Z',
    });
    expect(scan.isbn).toBe('9784003101018');
    expect(scan.scannedAt).toEqual(new Date('2026-08-01T10:00:00.000Z'));
  });

  it('throws when isbn is missing', () => {
    expect(() =>
      pendingScanFromJson({ scannedAt: '2026-08-01T10:00:00.000Z' }),
    ).toThrow();
  });

  it('throws when scannedAt is missing', () => {
    expect(() => pendingScanFromJson({ isbn: '9784003101018' })).toThrow();
  });
});

describe('pendingScanToJson', () => {
  it('serializes scannedAt as ISO string', () => {
    const json = pendingScanToJson({
      isbn: '9784003101018',
      scannedAt: new Date('2026-08-01T10:00:00.000Z'),
    });
    expect(json).toEqual({
      isbn: '9784003101018',
      scannedAt: '2026-08-01T10:00:00.000Z',
    });
  });

  it('round-trips through fromJson', () => {
    const original = {
      isbn: '9784167158057',
      scannedAt: new Date('2026-08-02T01:23:45.678Z'),
    };
    expect(pendingScanFromJson(pendingScanToJson(original))).toEqual(original);
  });
});
