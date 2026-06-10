export enum AvailabilityStatus {
  available = 'available',
  inLibraryOnly = 'inLibraryOnly',
  checkedOut = 'checkedOut',
  reserved = 'reserved',
  preparing = 'preparing',
  closed = 'closed',
  notFound = 'notFound',
  error = 'error',
  unknown = 'unknown',
}

export function availabilityPriority(status: AvailabilityStatus): number {
  switch (status) {
    case AvailabilityStatus.available:
      return 8;
    case AvailabilityStatus.inLibraryOnly:
      return 7;
    case AvailabilityStatus.checkedOut:
      return 6;
    case AvailabilityStatus.reserved:
      return 5;
    case AvailabilityStatus.preparing:
      return 4;
    case AvailabilityStatus.closed:
      return 3;
    case AvailabilityStatus.notFound:
      return 2;
    case AvailabilityStatus.error:
      return 1;
    case AvailabilityStatus.unknown:
      return 0;
  }
}

export function isReservable(status: AvailabilityStatus): boolean {
  switch (status) {
    case AvailabilityStatus.available:
    case AvailabilityStatus.inLibraryOnly:
    case AvailabilityStatus.checkedOut:
    case AvailabilityStatus.reserved:
    case AvailabilityStatus.preparing:
      return true;
    case AvailabilityStatus.notFound:
    case AvailabilityStatus.closed:
    case AvailabilityStatus.error:
    case AvailabilityStatus.unknown:
      return false;
  }
}

export function availabilityFromApiString(value: string): AvailabilityStatus {
  switch (value) {
    case '貸出可':
    case '蔵書あり':
      return AvailabilityStatus.available;
    case '館内のみ':
      return AvailabilityStatus.inLibraryOnly;
    case '貸出中':
      return AvailabilityStatus.checkedOut;
    case '予約中':
      return AvailabilityStatus.reserved;
    case '準備中':
      return AvailabilityStatus.preparing;
    case '休館中':
      return AvailabilityStatus.closed;
    case '蔵書なし':
    case '':
      return AvailabilityStatus.notFound;
    default:
      return AvailabilityStatus.unknown;
  }
}

export function aggregateAvailability(
  statuses: AvailabilityStatus[],
): AvailabilityStatus {
  if (statuses.length === 0) return AvailabilityStatus.notFound;
  return statuses.reduce((best, current) =>
    availabilityPriority(current) > availabilityPriority(best) ? current : best,
  );
}

/**
 * enum 名から AvailabilityStatus へ変換する。未知の名前は unknown を返す。
 *
 * 永続化された検索履歴には旧仕様や破損による未知のステータス名が含まれ得る。
 * throw すると履歴ページ全体がクラッシュするため、未知の値は unknown に倒す。
 */
export function availabilityFromName(name: string): AvailabilityStatus {
  const values = Object.values(AvailabilityStatus) as string[];
  return values.includes(name)
    ? (name as AvailabilityStatus)
    : AvailabilityStatus.unknown;
}
