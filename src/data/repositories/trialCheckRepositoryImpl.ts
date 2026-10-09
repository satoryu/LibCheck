import { AvailabilityStatus, availabilityFromApiString } from '@/domain/models/availabilityStatus';
import type { TrialCheckResult } from '@/domain/models/trialCheckResult';
import type { TrialCheckRepository } from '@/domain/repositories/trialCheckRepository';
import type { TrialCheckApiClient } from '@/data/datasources/trialCheckApiClient';

/** カーリルの図書館システムが確認中であることを示す状態。 */
const SYSTEM_RUNNING = 'Running';
/** カーリルの図書館システムの検索が失敗したことを示す状態。 */
const SYSTEM_ERROR = 'Error';

export class TrialCheckRepositoryImpl implements TrialCheckRepository {
  constructor(private readonly client: TrialCheckApiClient) {}

  async check(args: { isbn: string; pref: string; city: string }): Promise<TrialCheckResult> {
    const body = await this.client.check(args);
    return {
      isbn: body.isbn,
      complete: body.complete,
      omittedLibraryCount: body.omittedLibraryCount,
      libraries: body.libraries.map((library) => {
        const checking = library.systemStatus === SYSTEM_RUNNING;
        // システムの検索自体が失敗した場合は「蔵書なし」と区別して error にする
        // （libraryRepositoryImpl の既存の蔵書検索と同じ方針）。
        const status = checking
          ? AvailabilityStatus.unknown
          : library.systemStatus === SYSTEM_ERROR
            ? AvailabilityStatus.error
            : availabilityFromApiString(library.status);
        return {
          name: library.name,
          systemId: library.systemId,
          libKey: library.libKey,
          libId: library.libId,
          status,
          checking,
          reserveUrl: library.reserveUrl,
        };
      }),
    };
  }
}
