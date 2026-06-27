import {
  CalilApiException,
  CalilHttpException,
  CalilNetworkException,
  CalilParseException,
  CalilTimeoutException,
} from '@/data/exceptions/calilApiException';
import {
  type CheckResponse,
  checkResponseFromJson,
} from '@/data/models/checkResponse';
import {
  type LibraryResponse,
  libraryResponseFromJson,
} from '@/data/models/libraryResponse';
import { CALIL_API_CONFIG } from '@/data/datasources/calilApiConfig';
import { getAuthToken } from '@/data/datasources/authTokenStore';

/** Sleep helper used between polling requests. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface CalilApiClientOptions {
  appKey: string;
  /** Injectable for tests (default: globalThis.fetch.bind(globalThis)). */
  fetchFn?: typeof fetch;
  baseUrl?: string;
  pollingIntervalMs?: number;
  maxPollingCount?: number;
  httpTimeoutMs?: number;
  /**
   * 現在の ID トークンを返す関数（既定: AuthTokenStore の getAuthToken）。
   * 本番のプロキシ（/api/calil）は認証必須（#89）のため Bearer を付ける。
   * 未ログイン時は null を返し、ヘッダは付与しない。
   */
  tokenProvider?: () => string | null;
}

export class CalilApiClient {
  private readonly appKey: string;
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;
  private readonly pollingIntervalMs: number;
  private readonly maxPollingCount: number;
  private readonly httpTimeoutMs: number;
  private readonly tokenProvider: () => string | null;

  constructor(options: CalilApiClientOptions) {
    this.appKey = options.appKey;
    this.fetchFn =
      options.fetchFn ?? globalThis.fetch.bind(globalThis);
    this.tokenProvider = options.tokenProvider ?? getAuthToken;
    this.baseUrl = options.baseUrl ?? CALIL_API_CONFIG.baseUrl;
    this.pollingIntervalMs =
      options.pollingIntervalMs ?? CALIL_API_CONFIG.pollingIntervalMs;
    this.maxPollingCount =
      options.maxPollingCount ?? CALIL_API_CONFIG.maxPollingCount;
    this.httpTimeoutMs =
      options.httpTimeoutMs ?? CALIL_API_CONFIG.httpTimeoutMs;
  }

  async searchLibraries(args: {
    pref: string;
    city?: string;
  }): Promise<LibraryResponse[]> {
    const params: Record<string, string> = {
      appkey: this.appKey,
      pref: args.pref,
      format: 'json',
      callback: 'no',
    };
    if (args.city !== undefined) {
      params.city = args.city;
    }

    const url = this.buildUrl('/library', params);
    const body = this.parseJson(await this.executeRequest(url));

    if (!Array.isArray(body)) {
      throw new CalilParseException(
        'Expected JSON array for /library response',
      );
    }

    return body.map((entry) =>
      libraryResponseFromJson(entry as Record<string, unknown>),
    );
  }

  async checkAvailability(args: {
    isbn: string[];
    systemIds: string[];
  }): Promise<CheckResponse> {
    const params: Record<string, string> = {
      appkey: this.appKey,
      isbn: args.isbn.join(','),
      systemid: args.systemIds.join(','),
      format: 'json',
      callback: 'no',
    };

    const url = this.buildUrl('/check', params);
    let checkResponse = this.parseCheckResponse(
      await this.executeRequest(url),
    );

    let pollCount = 0;
    while (
      checkResponse.continueFlag === 1 &&
      pollCount < this.maxPollingCount
    ) {
      await delay(this.pollingIntervalMs);
      pollCount++;

      const pollParams: Record<string, string> = {
        appkey: this.appKey,
        session: checkResponse.session,
        format: 'json',
        callback: 'no',
      };
      const pollUrl = this.buildUrl('/check', pollParams);
      checkResponse = this.parseCheckResponse(
        await this.executeRequest(pollUrl),
      );
    }

    if (checkResponse.continueFlag === 1) {
      throw new CalilTimeoutException(
        `Polling exceeded maximum count of ${this.maxPollingCount}`,
      );
    }

    return checkResponse;
  }

  private buildUrl(path: string, params: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${path}`, this.urlBase());
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    // If baseUrl is absolute, URL ignores the second arg; otherwise the
    // relative path resolves against the dummy origin. Strip the dummy origin
    // for relative baseUrls so callers/tests see the original relative path.
    if (this.isAbsoluteBase()) {
      return url.toString();
    }
    return `${url.pathname}${url.search}`;
  }

  private isAbsoluteBase(): boolean {
    return /^https?:\/\//i.test(this.baseUrl);
  }

  private urlBase(): string {
    return this.isAbsoluteBase() ? this.baseUrl : 'http://localhost';
  }

  /** 認証必須プロキシ用の Authorization ヘッダ（未ログイン時は空）。 */
  private authHeaders(): Record<string, string> {
    const token = this.tokenProvider();
    return token ? { authorization: `Bearer ${token}` } : {};
  }

  private async executeRequest(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.httpTimeoutMs);

    let response: Response;
    try {
      response = await this.fetchFn(url, {
        signal: controller.signal,
        headers: this.authHeaders(),
      });
    } catch (e) {
      if (e instanceof CalilApiException) {
        throw e;
      }
      if (e instanceof DOMException && e.name === 'AbortError') {
        throw new CalilTimeoutException('Request timed out');
      }
      const message = e instanceof Error ? e.message : String(e);
      throw new CalilNetworkException(`Network error: ${message}`);
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status !== 200) {
      throw new CalilHttpException(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
      );
    }

    return response.text();
  }

  private parseJson(body: string): unknown {
    try {
      return JSON.parse(body);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      throw new CalilParseException(`Invalid JSON: ${message}`);
    }
  }

  private parseCheckResponse(body: string): CheckResponse {
    const parsed = this.parseJson(body);
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      throw new CalilParseException(
        'Expected JSON object for /check response',
      );
    }
    return checkResponseFromJson(parsed as Record<string, unknown>);
  }
}
