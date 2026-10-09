import type { LibraryAvailabilityCounts } from '@/analytics/events';
import { AvailabilityStatus } from '@/domain/models/availabilityStatus';
import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import type { TrialCheckResult } from '@/domain/models/trialCheckResult';
import { statusForLibKey } from '@/domain/models/libraryStatus';

/**
 * 蔵書検索結果を計測用の件数へ集計する（#169）。
 *
 * 結果画面は分館（libKey）単位で状況を表示するため、集計も画面表示と一致するよう
 * 分館単位で数える（`availabilityToHistoryStatuses` と同じ `statusForLibKey` を使う）。
 *
 * - 蔵書あり: `notFound` / `error` / `unknown` 以外。「貸出中」「予約中」等も
 *   その館に蔵書はあるため含める。
 * - 貸出可能: `available`（貸出可・蔵書あり）のみ。「館内のみ」は借りられないため含めない。
 *
 * `result` が無い、または結果に当該 systemId が含まれない館は unknown 扱いとし、
 * 検索対象数にだけ数える（例外は出さない）。
 */
export function countLibraryAvailability(
  result: BookAvailability | undefined,
  libraries: Library[],
): LibraryAvailabilityCounts {
  let holdingLibraryCount = 0;
  let availableLibraryCount = 0;

  for (const library of libraries) {
    const systemStatus = result?.libraryStatuses[library.systemId];
    if (systemStatus === undefined) continue;
    const status = statusForLibKey(systemStatus, library.libKey);
    if (!isHolding(status)) continue;
    holdingLibraryCount += 1;
    if (status === AvailabilityStatus.available) {
      availableLibraryCount += 1;
    }
  }

  return {
    searchedLibraryCount: libraries.length,
    holdingLibraryCount,
    availableLibraryCount,
  };
}

/**
 * 体験版（#183）の結果を、同じ基準（蔵書あり・貸出可能）で集計する。
 */
export function countTrialAvailability(result: TrialCheckResult): LibraryAvailabilityCounts {
  const holding = result.libraries.filter((library) => isHolding(library.status));
  return {
    searchedLibraryCount: result.libraries.length,
    holdingLibraryCount: holding.length,
    availableLibraryCount: holding.filter((library) => library.status === AvailabilityStatus.available)
      .length,
  };
}

/** その館に蔵書がある状態か（「貸出中」「予約中」等も含む）。 */
function isHolding(status: AvailabilityStatus): boolean {
  return (
    status !== AvailabilityStatus.notFound &&
    status !== AvailabilityStatus.error &&
    status !== AvailabilityStatus.unknown
  );
}
