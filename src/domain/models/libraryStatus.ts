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
  if (apiString === undefined) return AvailabilityStatus.notFound;
  return availabilityFromApiString(apiString);
}
