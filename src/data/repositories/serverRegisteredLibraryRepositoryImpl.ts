import { type Library, librariesEqual } from '@/domain/models/library';
import type { RegisteredLibraryRepository } from '@/domain/repositories/registeredLibraryRepository';
import type { RegisteredLibraryApiClient } from '@/data/datasources/registeredLibraryApiClient';
import { getAuthToken } from '@/data/datasources/authTokenStore';

/**
 * 登録図書館をサーバー（D1）に永続化する実装。
 *
 * 既存 `RegisteredLibraryRepository` の契約（更新後リストを返す）を保つため、
 * add/remove 等は「現在リスト取得 → 変更 → 全置換 PUT」で実現する。
 * トークンは `tokenProvider`（既定は AuthTokenStore）から取得する。
 */
export class ServerRegisteredLibraryRepositoryImpl
  implements RegisteredLibraryRepository
{
  constructor(
    private readonly apiClient: RegisteredLibraryApiClient,
    private readonly tokenProvider: () => string | null = getAuthToken,
  ) {}

  // 認証は HttpOnly セッション Cookie（#91）が主。リロード後はメモリにトークンが
  // 無い（null）が、Cookie で認証されるため例外にしない。未認証は API の 401 として
  // 表面化する。アクティブセッション中は後方互換で Bearer も併送される。
  private token(): string | null {
    return this.tokenProvider();
  }

  async getAll(): Promise<Library[]> {
    return this.apiClient.getAll(this.token());
  }

  async saveAll(libraries: Library[]): Promise<void> {
    await this.apiClient.saveAll(this.token(), libraries);
  }

  async add(library: Library): Promise<Library[]> {
    const current = await this.getAll();
    if (current.some((e) => librariesEqual(e, library))) return current;
    const next = [...current, library];
    await this.apiClient.saveAll(this.token(), next);
    return next;
  }

  async addAll(libraries: Library[]): Promise<Library[]> {
    const current = await this.getAll();
    const next = [...current];
    for (const library of libraries) {
      if (!next.some((e) => librariesEqual(e, library))) next.push(library);
    }
    await this.apiClient.saveAll(this.token(), next);
    return next;
  }

  async remove(library: Library): Promise<Library[]> {
    const current = await this.getAll();
    const next = current.filter((e) => !librariesEqual(e, library));
    await this.apiClient.saveAll(this.token(), next);
    return next;
  }
}
