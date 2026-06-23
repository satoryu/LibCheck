import { describe, it, expect } from 'vitest';

import type { Library } from '@/domain/models/library';
import { RegisteredLibraryApiClient } from '@/data/datasources/registeredLibraryApiClient';
import { ServerRegisteredLibraryRepositoryImpl } from '@/data/repositories/serverRegisteredLibraryRepositoryImpl';

function lib(systemId: string): Library {
  return {
    systemId, systemName: systemId, libKey: 'k', libId: systemId + '-id',
    shortName: 's', formalName: systemId + '図書館', address: 'a',
    pref: '東京都', city: '港区', category: 'MEDIUM',
  };
}
function jsonRes(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'content-type': 'application/json' },
  });
}

describe('RegisteredLibraryApiClient', () => {
  it('getAll は Bearer 付き GET で libraries を返す', async () => {
    let captured: { url: string; init?: RequestInit } | null = null;
    const fetchFn: typeof fetch = async (url, init) => {
      captured = { url: String(url), init: init ?? undefined };
      return jsonRes({ libraries: [lib('S1')] });
    };
    const client = new RegisteredLibraryApiClient({ fetchFn, baseUrl: '/api/registered-libraries' });

    const result = await client.getAll('tok123');

    expect(result.map((l) => l.systemId)).toEqual(['S1']);
    expect(captured!.url).toBe('/api/registered-libraries');
    expect(captured!.init?.method).toBe('GET');
    expect((captured!.init?.headers as Record<string, string>).authorization).toBe('Bearer tok123');
  });

  it('saveAll は PUT で libraries を送る', async () => {
    let captured: RequestInit | undefined;
    const fetchFn: typeof fetch = async (_url, init) => {
      captured = init ?? undefined;
      return jsonRes({ libraries: [] });
    };
    const client = new RegisteredLibraryApiClient({ fetchFn });
    await client.saveAll('tok', [lib('S1')]);
    expect(captured?.method).toBe('PUT');
    expect(JSON.parse(String(captured?.body)).libraries[0].systemId).toBe('S1');
  });

  it('200 以外は例外', async () => {
    const fetchFn: typeof fetch = async () => jsonRes({}, 401);
    const client = new RegisteredLibraryApiClient({ fetchFn });
    await expect(client.getAll('tok')).rejects.toThrow();
  });
});

/** in-memory な fake API client（リポジトリ挙動の検証用）。 */
class FakeApi {
  libs: Library[] = [];
  async getAll(): Promise<Library[]> { return [...this.libs]; }
  async saveAll(_token: string, libraries: Library[]): Promise<void> { this.libs = [...libraries]; }
}

describe('ServerRegisteredLibraryRepositoryImpl', () => {
  function make() {
    const api = new FakeApi();
    const repo = new ServerRegisteredLibraryRepositoryImpl(api as never, () => 'tok');
    return { api, repo };
  }

  it('add で追加し更新後リストを返す（重複は無視）', async () => {
    const { repo } = make();
    expect((await repo.add(lib('S1'))).map((l) => l.systemId)).toEqual(['S1']);
    expect((await repo.add(lib('S2'))).map((l) => l.systemId)).toEqual(['S1', 'S2']);
    // 重複
    expect((await repo.add(lib('S1'))).map((l) => l.systemId)).toEqual(['S1', 'S2']);
    expect((await repo.getAll()).map((l) => l.systemId)).toEqual(['S1', 'S2']);
  });

  it('remove で削除する', async () => {
    const { repo } = make();
    await repo.addAll([lib('S1'), lib('S2')]);
    expect((await repo.remove(lib('S1'))).map((l) => l.systemId)).toEqual(['S2']);
  });

  it('未認証（トークン無し）は例外', async () => {
    const repo = new ServerRegisteredLibraryRepositoryImpl(new FakeApi() as never, () => null);
    await expect(repo.getAll()).rejects.toThrow();
  });
});
