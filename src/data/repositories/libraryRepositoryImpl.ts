import { CalilApiClient } from '@/data/datasources/calilApiClient';
import {
  aggregateAvailability,
  availabilityFromApiString,
} from '@/domain/models/availabilityStatus';
import type { BookAvailability } from '@/domain/models/bookAvailability';
import type { Library } from '@/domain/models/library';
import type { LibraryStatus } from '@/domain/models/libraryStatus';
import type { LibraryRepository } from '@/domain/repositories/libraryRepository';

export class LibraryRepositoryImpl implements LibraryRepository {
  private readonly apiClient: CalilApiClient;

  constructor(args: { apiClient: CalilApiClient }) {
    this.apiClient = args.apiClient;
  }

  async getLibraries(args: {
    pref: string;
    city?: string;
  }): Promise<Library[]> {
    const responses = await this.apiClient.searchLibraries({
      pref: args.pref,
      city: args.city,
    });

    return responses.map((r) => ({
      systemId: r.systemId,
      systemName: r.systemName,
      libKey: r.libKey,
      libId: r.libId,
      shortName: r.shortName,
      formalName: r.formalName,
      address: r.address,
      pref: r.pref,
      city: r.city,
      category: r.category,
      url: r.urlPc,
      tel: r.tel,
      geocode: r.geocode,
    }));
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
        const statuses = Object.values(libKeyStatuses).map(
          availabilityFromApiString,
        );
        const aggregatedStatus = aggregateAvailability(statuses);

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
