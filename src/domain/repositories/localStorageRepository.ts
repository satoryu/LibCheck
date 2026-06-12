export interface LocalStorageRepository {
  getString(key: string): Promise<string | null>;
  setString(key: string, value: string): Promise<void>;
  getStringList(key: string): Promise<string[] | null>;
  setStringList(key: string, value: string[]): Promise<void>;
  remove(key: string): Promise<void>;
}
