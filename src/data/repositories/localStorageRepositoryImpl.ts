import type { LocalStorageRepository } from '@/domain/repositories/localStorageRepository';

/**
 * `LocalStorageRepository` backed by `window.localStorage`.
 * Web replacement for the Flutter `shared_preferences`-backed implementation.
 *
 * `getStringList` / `setStringList` store JSON-encoded string arrays.
 */
export class WebLocalStorageRepository implements LocalStorageRepository {
  private readonly storage: Storage;

  constructor(storage: Storage = window.localStorage) {
    this.storage = storage;
  }

  async getString(key: string): Promise<string | null> {
    return this.storage.getItem(key);
  }

  async setString(key: string, value: string): Promise<void> {
    this.storage.setItem(key, value);
  }

  async getStringList(key: string): Promise<string[] | null> {
    const raw = this.storage.getItem(key);
    if (raw === null) return null;

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      return parsed.filter((e): e is string => typeof e === 'string');
    } catch {
      return null;
    }
  }

  async setStringList(key: string, value: string[]): Promise<void> {
    this.storage.setItem(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    this.storage.removeItem(key);
  }
}
