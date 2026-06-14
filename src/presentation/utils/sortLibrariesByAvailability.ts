import {
  AvailabilityStatus,
  availabilityPriority,
} from '@/domain/models/availabilityStatus';
import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import { statusForLibKey } from '@/domain/models/libraryStatus';

/**
 * 登録図書館を在庫状況の優先度降順で並べ替える。
 *
 * 「貸出可能・蔵書あり」(= AvailabilityStatus.available) が最上位、「蔵書なし」
 * 等が下位に来る。優先度は既存の `availabilityPriority` を再利用する。
 *
 * - 元配列（React Query のキャッシュ）を破壊しないようコピーしてからソートする。
 * - `Array.prototype.sort` は安定なので、同順位の図書館は登録順を保持する。
 * - `result` が無い／result に当該 systemId が無い館は unknown（最下位）扱いとし、
 *   例外を出さない。
 */
export function sortLibrariesByAvailability(
  libraries: Library[],
  result: BookAvailability | undefined,
): Library[] {
  const priorityOf = (library: Library): number => {
    const libraryStatus = result?.libraryStatuses[library.systemId];
    const status =
      libraryStatus !== undefined
        ? statusForLibKey(libraryStatus, library.libKey)
        : AvailabilityStatus.unknown;
    return availabilityPriority(status);
  };

  return [...libraries].sort((a, b) => priorityOf(b) - priorityOf(a));
}
