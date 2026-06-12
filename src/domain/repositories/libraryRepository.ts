import { BookAvailability } from '@/domain/models/bookAvailability';
import { Library } from '@/domain/models/library';

export interface LibraryRepository {
  getLibraries(args: { pref: string; city?: string }): Promise<Library[]>;
  checkBookAvailability(args: {
    isbn: string[];
    systemIds: string[];
  }): Promise<BookAvailability[]>;
}
