import { describe, expect, test } from 'vitest';

import { AvailabilityStatus } from '@/domain/models/availabilityStatus';
import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import { countLibraryAvailability } from '@/presentation/utils/availabilityCounts';

function makeLibrary(systemId: string, libKey: string): Library {
  return {
    systemId,
    systemName: `${systemId} システム`,
    libKey,
    libId: `${systemId}-${libKey}`,
    shortName: libKey,
    formalName: `${libKey}図書館`,
    address: '住所',
    pref: '東京都',
    city: '千代田区',
    category: 'MEDIUM',
  };
}

const central = makeLibrary('Tokyo_Chiyoda', '中央');
const branch = makeLibrary('Tokyo_Chiyoda', '分館');
const other = makeLibrary('Tokyo_Minato', '港');

function makeResult(
  libKeyStatuses: Record<string, Record<string, string>>,
  systemStatus: AvailabilityStatus = AvailabilityStatus.available,
): BookAvailability {
  const libraryStatuses = Object.fromEntries(
    Object.entries(libKeyStatuses).map(([systemId, statuses]) => [
      systemId,
      { systemId, status: systemStatus, libKeyStatuses: statuses },
    ]),
  );
  return { isbn: '9784000000000', libraryStatuses };
}

describe('countLibraryAvailability', () => {
  test('貸出可・貸出中・蔵書なしを区別して数える', () => {
    const result = makeResult({
      Tokyo_Chiyoda: { 中央: '貸出可', 分館: '貸出中' },
      Tokyo_Minato: { 港: '蔵書なし' },
    });

    expect(countLibraryAvailability(result, [central, branch, other])).toEqual({
      searchedLibraryCount: 3,
      holdingLibraryCount: 2,
      availableLibraryCount: 1,
    });
  });

  test('館内のみは蔵書ありだが貸出可能には数えない', () => {
    const result = makeResult({ Tokyo_Chiyoda: { 中央: '館内のみ' } });

    expect(countLibraryAvailability(result, [central])).toEqual({
      searchedLibraryCount: 1,
      holdingLibraryCount: 1,
      availableLibraryCount: 0,
    });
  });

  test('システム検索がエラーの館は蔵書ありに数えない', () => {
    const result = makeResult(
      { Tokyo_Chiyoda: {} },
      AvailabilityStatus.error,
    );

    expect(countLibraryAvailability(result, [central])).toEqual({
      searchedLibraryCount: 1,
      holdingLibraryCount: 0,
      availableLibraryCount: 0,
    });
  });

  test('結果に含まれない図書館は検索対象には数えるが蔵書ありにはしない', () => {
    const result = makeResult({ Tokyo_Chiyoda: { 中央: '貸出可' } });

    expect(countLibraryAvailability(result, [central, other])).toEqual({
      searchedLibraryCount: 2,
      holdingLibraryCount: 1,
      availableLibraryCount: 1,
    });
  });

  test('結果が無い場合は検索対象数だけを返す', () => {
    expect(countLibraryAvailability(undefined, [central, branch])).toEqual({
      searchedLibraryCount: 2,
      holdingLibraryCount: 0,
      availableLibraryCount: 0,
    });
  });

  test('登録図書館が無い場合はすべて0', () => {
    expect(countLibraryAvailability(undefined, [])).toEqual({
      searchedLibraryCount: 0,
      holdingLibraryCount: 0,
      availableLibraryCount: 0,
    });
  });
});
