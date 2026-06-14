import { describe, expect, test } from 'vitest';

import { AvailabilityStatus } from '@/domain/models/availabilityStatus';
import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import { sortLibrariesByAvailability } from '@/presentation/utils/sortLibrariesByAvailability';

function makeLibrary(systemId: string, libKey: string): Library {
  return {
    systemId,
    systemName: systemId,
    libKey,
    libId: `${systemId}-${libKey}`,
    shortName: libKey,
    formalName: `${libKey}図書館`,
    address: '東京都',
    pref: '東京都',
    city: '区',
    category: 'MEDIUM',
  };
}

describe('sortLibrariesByAvailability', () => {
  test('在庫状況の優先度降順に並べ替える（貸出可能が最上位、蔵書なしが最下位）', () => {
    const libNotFound = makeLibrary('Sys_NF', 'nf');
    const libAvailable = makeLibrary('Sys_AV', 'av');
    const libCheckedOut = makeLibrary('Sys_CO', 'co');
    // 登録順は notFound → available → checkedOut
    const libraries = [libNotFound, libAvailable, libCheckedOut];

    const result: BookAvailability = {
      isbn: '9784873117584',
      libraryStatuses: {
        Sys_NF: {
          systemId: 'Sys_NF',
          status: AvailabilityStatus.notFound,
          libKeyStatuses: { nf: '蔵書なし' },
        },
        Sys_AV: {
          systemId: 'Sys_AV',
          status: AvailabilityStatus.available,
          libKeyStatuses: { av: '貸出可' },
        },
        Sys_CO: {
          systemId: 'Sys_CO',
          status: AvailabilityStatus.checkedOut,
          libKeyStatuses: { co: '貸出中' },
        },
      },
    };

    const sorted = sortLibrariesByAvailability(libraries, result);

    expect(sorted.map((l) => l.systemId)).toEqual(['Sys_AV', 'Sys_CO', 'Sys_NF']);
  });

  test('「蔵書あり」は「貸出可」と同じく最上位に来る', () => {
    const libNotFound = makeLibrary('Sys_NF', 'nf');
    const libInStock = makeLibrary('Sys_IS', 'is');
    const libraries = [libNotFound, libInStock];

    const result: BookAvailability = {
      isbn: '9784873117584',
      libraryStatuses: {
        Sys_NF: {
          systemId: 'Sys_NF',
          status: AvailabilityStatus.notFound,
          libKeyStatuses: { nf: '蔵書なし' },
        },
        Sys_IS: {
          systemId: 'Sys_IS',
          status: AvailabilityStatus.available,
          libKeyStatuses: { is: '蔵書あり' },
        },
      },
    };

    const sorted = sortLibrariesByAvailability(libraries, result);

    expect(sorted.map((l) => l.systemId)).toEqual(['Sys_IS', 'Sys_NF']);
  });

  test('同じ優先度の図書館は登録順を保持する（安定ソート）', () => {
    const libA = makeLibrary('Sys_A', 'a');
    const libB = makeLibrary('Sys_B', 'b');
    const libraries = [libA, libB];

    const result: BookAvailability = {
      isbn: '9784873117584',
      libraryStatuses: {
        Sys_A: {
          systemId: 'Sys_A',
          status: AvailabilityStatus.available,
          libKeyStatuses: { a: '貸出可' },
        },
        Sys_B: {
          systemId: 'Sys_B',
          status: AvailabilityStatus.available,
          libKeyStatuses: { b: '貸出可' },
        },
      },
    };

    const sorted = sortLibrariesByAvailability(libraries, result);

    expect(sorted.map((l) => l.systemId)).toEqual(['Sys_A', 'Sys_B']);
  });

  test('元の配列をミューテートしない', () => {
    const libNotFound = makeLibrary('Sys_NF', 'nf');
    const libAvailable = makeLibrary('Sys_AV', 'av');
    const libraries = [libNotFound, libAvailable];
    const original = [...libraries];

    const result: BookAvailability = {
      isbn: '9784873117584',
      libraryStatuses: {
        Sys_NF: {
          systemId: 'Sys_NF',
          status: AvailabilityStatus.notFound,
          libKeyStatuses: { nf: '蔵書なし' },
        },
        Sys_AV: {
          systemId: 'Sys_AV',
          status: AvailabilityStatus.available,
          libKeyStatuses: { av: '貸出可' },
        },
      },
    };

    sortLibrariesByAvailability(libraries, result);

    expect(libraries).toEqual(original);
  });

  test('result が undefined でも例外を出さず、入力順のコピーを返す', () => {
    const libA = makeLibrary('Sys_A', 'a');
    const libB = makeLibrary('Sys_B', 'b');
    const libraries = [libA, libB];

    const sorted = sortLibrariesByAvailability(libraries, undefined);

    expect(sorted.map((l) => l.systemId)).toEqual(['Sys_A', 'Sys_B']);
  });

  test('result に存在しない館は最下位（unknown）に回る', () => {
    const libKnown = makeLibrary('Sys_K', 'k');
    const libMissing = makeLibrary('Sys_M', 'm');
    // 登録順は missing → known
    const libraries = [libMissing, libKnown];

    const result: BookAvailability = {
      isbn: '9784873117584',
      libraryStatuses: {
        Sys_K: {
          systemId: 'Sys_K',
          status: AvailabilityStatus.notFound,
          libKeyStatuses: { k: '蔵書なし' },
        },
      },
    };

    const sorted = sortLibrariesByAvailability(libraries, result);

    // notFound(2) > unknown(0) なので known が前。
    expect(sorted.map((l) => l.systemId)).toEqual(['Sys_K', 'Sys_M']);
  });
});
