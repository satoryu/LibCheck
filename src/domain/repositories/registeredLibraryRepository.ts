import { Library } from '@/domain/models/library';

export interface RegisteredLibraryRepository {
  getAll(): Promise<Library[]>;
  saveAll(libraries: Library[]): Promise<void>;
  add(library: Library): Promise<Library[]>;
  addAll(libraries: Library[]): Promise<Library[]>;
  remove(library: Library): Promise<Library[]>;
}
