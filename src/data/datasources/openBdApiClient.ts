import {
  type OpenBdResponse,
  openBdResponseFromJson,
} from '@/data/models/openBdResponse';
import { OPENBD_API_CONFIG } from '@/data/datasources/openBdApiConfig';

export interface OpenBdApiClientOptions {
  /** Injectable for tests (default: globalThis.fetch.bind(globalThis)). */
  fetchFn?: typeof fetch;
  baseUrl?: string;
  httpTimeoutMs?: number;
}

/**
 * OpenBD `/get` API クライアント。
 *
 * APIキー不要・CORS 開放のためブラウザから直接呼び出す。レスポンスは
 * `[ item | null, ... ]` 形式で、該当が無い ISBN は要素が null になる。
 */
export class OpenBdApiClient {
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;
  private readonly httpTimeoutMs: number;

  constructor(options: OpenBdApiClientOptions = {}) {
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.baseUrl = options.baseUrl ?? OPENBD_API_CONFIG.baseUrl;
    this.httpTimeoutMs = options.httpTimeoutMs ?? OPENBD_API_CONFIG.httpTimeoutMs;
  }

  /**
   * ISBN に対応する書誌情報を取得する。該当が無ければ null。
   * HTTP エラー・ネットワークエラー・パースエラーは例外を投げる。
   */
  async getByIsbn(isbn: string): Promise<OpenBdResponse | null> {
    const parsed = await this.fetchParsed(
      `${this.baseUrl}/get?isbn=${encodeURIComponent(isbn)}`,
    );
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return null;
    }
    const first = parsed[0];
    if (first === null || typeof first !== 'object') {
      return null;
    }
    return openBdResponseFromJson(first as Record<string, unknown>);
  }

  /**
   * 複数 ISBN の書誌情報を CSV 指定の1リクエストで一括取得する（#141）。
   * 戻りは要求順で、該当が無い ISBN は null。空配列はリクエストせず [] を返す。
   */
  async getByIsbns(isbns: string[]): Promise<(OpenBdResponse | null)[]> {
    if (isbns.length === 0) {
      return [];
    }
    const parsed = await this.fetchParsed(
      `${this.baseUrl}/get?isbn=${encodeURIComponent(isbns.join(','))}`,
    );
    if (!Array.isArray(parsed)) {
      return isbns.map(() => null);
    }
    return isbns.map((_, i) => {
      const entry = parsed[i];
      if (entry === null || entry === undefined || typeof entry !== 'object') {
        return null;
      }
      return openBdResponseFromJson(entry as Record<string, unknown>);
    });
  }

  /** 共通のリクエスト処理（タイムアウト・エラーメッセージは従来どおり）。 */
  private async fetchParsed(url: string): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.httpTimeoutMs);

    let response: Response;
    try {
      response = await this.fetchFn(url, { signal: controller.signal });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        throw new Error('OpenBD request timed out');
      }
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`OpenBD network error: ${message}`);
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status !== 200) {
      throw new Error(`OpenBD HTTP ${response.status}: ${response.statusText}`);
    }

    return JSON.parse(await response.text()) as unknown;
  }
}
