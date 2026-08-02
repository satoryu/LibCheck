import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import { libraryKey } from '@/domain/models/library';
import { statusForLibKey } from '@/domain/models/libraryStatus';

/**
 * 蔵書検索結果を検索履歴の分館単位ステータス（キー: libraryKey、値:
 * AvailabilityStatus の enum 名）へ変換する。
 *
 * 結果画面での履歴保存（BookSearchResultPage）と保留スキャンの自動検索
 * （usePendingScanProcessor、#144）で同じ形式になるよう共用する。
 */
export function availabilityToHistoryStatuses(
  result: BookAvailability,
  registeredLibraries: Library[],
): Record<string, string> {
  const statuses: Record<string, string> = {};
  for (const library of registeredLibraries) {
    const systemStatus = result.libraryStatuses[library.systemId];
    if (systemStatus === undefined) continue;
    statuses[libraryKey(library)] = statusForLibKey(
      systemStatus,
      library.libKey,
    );
  }
  return statuses;
}
