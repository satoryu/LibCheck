import type { Library } from '@/domain/models/library';

export interface StaticLibraryDataSourceOptions {
  /** Injectable for tests (default: globalThis.fetch.bind(globalThis)). */
  fetchFn?: typeof fetch;
  /** 静的JSONの配信元ディレクトリ（既定: `/data/libraries`）。 */
  baseUrl?: string;
}

/**
 * `scripts/generateLibraryData.mjs`（#158）がビルド前提で生成した、
 * 都道府県別の静的JSON（`public/data/libraries/{pref}.json`）を取得する。
 *
 * カーリル `/library` API を一切呼ばないため、地域ページの閲覧が
 * カーリルの利用制限を消費しない（design.md 参照）。
 */
export class StaticLibraryDataSource {
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;

  constructor(options: StaticLibraryDataSourceOptions = {}) {
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.baseUrl = options.baseUrl ?? '/data/libraries';
  }

  async getByPrefecture(pref: string): Promise<Library[]> {
    const url = `${this.baseUrl}/${encodeURIComponent(pref)}.json`;
    const res = await this.fetchFn(url);
    if (!res.ok) {
      throw new Error(
        `静的図書館データの取得に失敗しました（${pref}）: HTTP ${res.status}`,
      );
    }
    return (await res.json()) as Library[];
  }
}
