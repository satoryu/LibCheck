import {
  AvailabilityStatus,
  availabilityFromApiString,
} from '@/domain/models/availabilityStatus';

export interface LibraryStatus {
  systemId: string;
  status: AvailabilityStatus;
  reserveUrl?: string;
  libKeyStatuses: Record<string, string>;
}

export function statusForLibKey(
  ls: LibraryStatus,
  libKey: string,
): AvailabilityStatus {
  const apiString = ls.libKeyStatuses[libKey];
  if (apiString === undefined) {
    // システム検索がエラーのとき libkey は空になる。蔵書なし(notFound)では
    // なく、システム全体の error 状態をそのまま分館にも反映する。
    return ls.status === AvailabilityStatus.error
      ? AvailabilityStatus.error
      : AvailabilityStatus.notFound;
  }
  return availabilityFromApiString(apiString);
}
