import {
  type Library,
  librariesEqual,
  libraryFromJson,
  libraryToJson,
} from '@/domain/models/library';
import type { LocalStorageRepository } from '@/domain/repositories/localStorageRepository';
import type { RegisteredLibraryRepository } from '@/domain/repositories/registeredLibraryRepository';

const STORAGE_KEY = 'registered_libraries';

export class RegisteredLibraryRepositoryImpl
  implements RegisteredLibraryRepository
{
  private readonly localStorage: LocalStorageRepository;

  constructor(localStorage: LocalStorageRepository) {
    this.localStorage = localStorage;
  }

  async getAll(): Promise<Library[]> {
    const jsonString = await this.localStorage.getString(STORAGE_KEY);
    if (jsonString === null) return [];

    try {
      const parsed: unknown = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((e) =>
        libraryFromJson(e as Record<string, unknown>),
      );
    } catch {
      return [];
    }
  }

  async saveAll(libraries: Library[]): Promise<void> {
    const jsonList = libraries.map((e) => libraryToJson(e));
    await this.localStorage.setString(STORAGE_KEY, JSON.stringify(jsonList));
  }

  async add(library: Library): Promise<Library[]> {
    const current = await this.getAll();
    if (current.some((e) => librariesEqual(e, library))) return current;
    current.push(library);
    await this.saveAll(current);
    return current;
  }

  async addAll(libraries: Library[]): Promise<Library[]> {
    const current = await this.getAll();
    for (const library of libraries) {
      if (!current.some((e) => librariesEqual(e, library))) {
        current.push(library);
      }
    }
    await this.saveAll(current);
    return current;
  }

  async remove(library: Library): Promise<Library[]> {
    const current = await this.getAll();
    const filtered = current.filter((e) => !librariesEqual(e, library));
    await this.saveAll(filtered);
    return filtered;
  }
}
