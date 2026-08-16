import { CalilApiClient } from '@/data/datasources/calilApiClient';
import type { StaticLibraryDataSource } from '@/data/datasources/staticLibraryDataSource';
import {
  AvailabilityStatus,
  aggregateAvailability,
  availabilityFromApiString,
} from '@/domain/models/availabilityStatus';
import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import type { LibraryStatus } from '@/domain/models/libraryStatus';
import type { LibraryRepository } from '@/domain/repositories/libraryRepository';

export class LibraryRepositoryImpl implements LibraryRepository {
  private readonly apiClient: CalilApiClient;
  private readonly staticLibraryDataSource: StaticLibraryDataSource;

  constructor(args: {
    /** checkBookAvailability（蔵書検索・認証必須）専用。#158 以降 getLibraries には使わない。 */
    apiClient: CalilApiClient;
    /**
     * getLibraries 専用（#158）。`scripts/generateLibraryData.mjs` がビルド
     * 前提で生成した静的JSONを読む。地域ページの閲覧がカーリルの利用制限を
     * 消費しないようにするための変更。詳細は docs/158-regional-pages/design.md。
     */
    staticLibraryDataSource: StaticLibraryDataSource;
  }) {
    this.apiClient = args.apiClient;
    this.staticLibraryDataSource = args.staticLibraryDataSource;
  }

  async getLibraries(args: {
    pref: string;
    city?: string;
  }): Promise<Library[]> {
    const libraries = await this.staticLibraryDataSource.getByPrefecture(args.pref);
    if (args.city === undefined) return libraries;
    return libraries.filter((lib) => lib.city === args.city);
  }

  async checkBookAvailability(args: {
    isbn: string[];
    systemIds: string[];
  }): Promise<BookAvailability[]> {
    const response = await this.apiClient.checkAvailability({
      isbn: args.isbn,
      systemIds: args.systemIds,
    });

    return Object.entries(response.books).map(([isbnValue, systems]) => {
      const libraryStatuses: Record<string, LibraryStatus> = {};
      for (const [systemId, bookSystemStatus] of Object.entries(systems)) {
        const libKeyStatuses = bookSystemStatus.libKeys;
        // システム側で検索が失敗すると status は "Error" になり libkey は空で
        // 返る。この場合 libkey 集約では notFound(蔵書なし) になってしまい
        // 「検索失敗」と「蔵書なし」が区別できないため、明示的に error とする。
        const aggregatedStatus =
          bookSystemStatus.status === 'Error'
            ? AvailabilityStatus.error
            : aggregateAvailability(
                Object.values(libKeyStatuses).map(availabilityFromApiString),
              );

        libraryStatuses[systemId] = {
          systemId,
          status: aggregatedStatus,
          reserveUrl: bookSystemStatus.reserveUrl,
          libKeyStatuses,
        };
      }

      return {
        isbn: isbnValue,
        libraryStatuses,
      };
    });
  }
}
