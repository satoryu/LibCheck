import type { Library } from '@/domain/models/library';
import { protectedRequest } from '@/data/datasources/protectedApi';

export interface RegisteredLibraryApiClientOptions {
  fetchFn?: typeof fetch;
  baseUrl?: string;
  httpTimeoutMs?: number;
}

/** `/api/registered-libraries`（GET 一覧 / PUT 全置換）を叩くクライアント。 */
export class RegisteredLibraryApiClient {
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;
  private readonly httpTimeoutMs: number;

  constructor(options: RegisteredLibraryApiClientOptions = {}) {
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.baseUrl = options.baseUrl ?? '/api/registered-libraries';
    this.httpTimeoutMs = options.httpTimeoutMs ?? 10000;
  }

  async getAll(token: string | null): Promise<Library[]> {
    const body = (await protectedRequest(
      this.fetchFn,
      this.baseUrl,
      'GET',
      token,
      undefined,
      this.httpTimeoutMs,
    )) as { libraries?: unknown };
    return Array.isArray(body.libraries) ? (body.libraries as Library[]) : [];
  }

  async saveAll(token: string | null, libraries: Library[]): Promise<void> {
    await protectedRequest(
      this.fetchFn,
      this.baseUrl,
      'PUT',
      token,
      { libraries },
      this.httpTimeoutMs,
    );
  }
}
