import { describe, expect, test, vi } from 'vitest';

import { CalilApiClient } from '@/data/datasources/calilApiClient';
import {
  CalilHttpException,
  CalilNetworkException,
  CalilParseException,
  CalilTimeoutException,
} from '@/data/exceptions/calilApiException';

/**
 * Builds a `fetchFn` mock that parses the request URL and returns a standard
 * `Response`. Replaces the Dart `MockClient`. `handler` receives the parsed
 * `URL` and returns `{ body, status }` (body is JSON-encoded, status defaults
 * to 200). If `body` is a string it is sent verbatim (for invalid-JSON cases).
 */
function makeFetchFn(
  handler: (url: URL) => { body: unknown; status?: number },
): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const url = new URL(String(input), 'http://localhost');
    const { body, status = 200 } = handler(url);
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    return new Response(payload, { status });
  }) as unknown as typeof fetch;
}

describe('CalilApiClient.checkAvailability', () => {
  test('returns result immediately when continue=0', async () => {
    const fetchFn = makeFetchFn((url) => {
      expect(url.pathname).toBe('/check');
      expect(url.searchParams.get('isbn')).toBe('9784774142230');
      expect(url.searchParams.get('systemid')).toBe('Tokyo_Minato');

      return {
        body: {
          session: 'abc123',
          continue: 0,
          books: {
            '9784774142230': {
              Tokyo_Minato: {
                status: 'OK',
                reserveurl: 'https://example.com/reserve',
                libkey: { みなと: '貸出可' },
              },
            },
          },
        },
      };
    });

    const client = new CalilApiClient({
      appKey: 'test_api_key',
      fetchFn,
      baseUrl: '',
      pollingIntervalMs: 0,
    });

    const result = await client.checkAvailability({
      isbn: ['9784774142230'],
      systemIds: ['Tokyo_Minato'],
    });

    expect(result.session).toBe('abc123');
    expect(result.continueFlag).toBe(0);
    expect(result.books['9784774142230']!.Tokyo_Minato!.libKeys['みなと']).toBe(
      '貸出可',
    );
  });

  test('polls until continue=0', async () => {
    let requestCount = 0;

    const fetchFn = makeFetchFn((url) => {
      requestCount++;

      if (requestCount === 1) {
        return {
          body: {
            session: 'abc123',
            continue: 1,
            books: {
              '9784774142230': {
                Tokyo_Minato: {
                  status: 'Running',
                  libkey: {},
                },
              },
            },
          },
        };
      }

      // Second request should use session parameter.
      expect(url.searchParams.get('session')).toBe('abc123');

      return {
        body: {
          session: 'abc123',
          continue: 0,
          books: {
            '9784774142230': {
              Tokyo_Minato: {
                status: 'OK',
                libkey: { みなと: '貸出可' },
              },
            },
          },
        },
      };
    });

    const client = new CalilApiClient({
      appKey: 'test_api_key',
      fetchFn,
      baseUrl: '',
      pollingIntervalMs: 0,
    });

    const result = await client.checkAvailability({
      isbn: ['9784774142230'],
      systemIds: ['Tokyo_Minato'],
    });

    expect(requestCount).toBe(2);
    expect(result.continueFlag).toBe(0);
    expect(result.books['9784774142230']!.Tokyo_Minato!.libKeys['みなと']).toBe(
      '貸出可',
    );
  });

  test('throws CalilTimeoutException when max polling exceeded', async () => {
    const fetchFn = makeFetchFn(() => ({
      body: {
        session: 'abc123',
        continue: 1,
        books: {
          '9784774142230': {
            Tokyo_Minato: {
              status: 'Running',
              libkey: {},
            },
          },
        },
      },
    }));

    const client = new CalilApiClient({
      appKey: 'test_api_key',
      fetchFn,
      baseUrl: '',
      pollingIntervalMs: 0,
      maxPollingCount: 2,
    });

    await expect(
      client.checkAvailability({
        isbn: ['9784774142230'],
        systemIds: ['Tokyo_Minato'],
      }),
    ).rejects.toBeInstanceOf(CalilTimeoutException);
  });

  test('joins multiple ISBNs and systemIds with commas', async () => {
    const fetchFn = makeFetchFn((url) => {
      expect(url.searchParams.get('isbn')).toBe(
        '9784774142230,9784873115658',
      );
      expect(url.searchParams.get('systemid')).toBe(
        'Tokyo_Minato,Tokyo_Shibuya',
      );

      return {
        body: {
          session: 'abc123',
          continue: 0,
          books: {},
        },
      };
    });

    const client = new CalilApiClient({
      appKey: 'test_api_key',
      fetchFn,
      baseUrl: '',
      pollingIntervalMs: 0,
    });

    await client.checkAvailability({
      isbn: ['9784774142230', '9784873115658'],
      systemIds: ['Tokyo_Minato', 'Tokyo_Shibuya'],
    });
  });

  test('throws CalilNetworkException on network error', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('Connection refused');
    }) as unknown as typeof fetch;

    const client = new CalilApiClient({
      appKey: 'test_api_key',
      fetchFn,
      baseUrl: '',
    });

    await expect(
      client.checkAvailability({
        isbn: ['9784774142230'],
        systemIds: ['Tokyo_Minato'],
      }),
    ).rejects.toBeInstanceOf(CalilNetworkException);
  });

  test('throws CalilParseException on invalid JSON', async () => {
    const fetchFn = makeFetchFn(() => ({ body: 'not valid json' }));

    const client = new CalilApiClient({
      appKey: 'test_api_key',
      fetchFn,
      baseUrl: '',
    });

    await expect(
      client.checkAvailability({
        isbn: ['9784774142230'],
        systemIds: ['Tokyo_Minato'],
      }),
    ).rejects.toBeInstanceOf(CalilParseException);
  });
});

describe('CalilApiClient.searchLibraries', () => {
  test('returns list of LibraryResponse on success', async () => {
    const fetchFn = makeFetchFn((url) => {
      expect(url.pathname).toBe('/library');
      expect(url.searchParams.get('appkey')).toBe('test_api_key');
      expect(url.searchParams.get('pref')).toBe('東京都');
      expect(url.searchParams.get('format')).toBe('json');

      return {
        body: [
          {
            systemid: 'Tokyo_Minato',
            systemname: '港区図書館',
            libkey: 'みなと',
            libid: '123',
            short: 'みなと図書館',
            formal: '港区立みなと図書館',
            address: '東京都港区芝公園3-2-25',
            pref: '東京都',
            city: '港区',
            category: 'MEDIUM',
          },
        ],
      };
    });

    const client = new CalilApiClient({
      appKey: 'test_api_key',
      fetchFn,
      baseUrl: '',
    });

    const results = await client.searchLibraries({ pref: '東京都' });

    expect(results).toHaveLength(1);
    expect(results[0]!.systemId).toBe('Tokyo_Minato');
    expect(results[0]!.formalName).toBe('港区立みなと図書館');
  });

  test('passes city parameter when provided', async () => {
    const fetchFn = makeFetchFn((url) => {
      expect(url.searchParams.get('city')).toBe('港区');
      return { body: [] };
    });

    const client = new CalilApiClient({
      appKey: 'test_api_key',
      fetchFn,
      baseUrl: '',
    });

    await client.searchLibraries({ pref: '東京都', city: '港区' });
  });

  test('throws CalilHttpException on non-200 status', async () => {
    const fetchFn = makeFetchFn(() => ({
      body: 'Internal Server Error',
      status: 500,
    }));

    const client = new CalilApiClient({
      appKey: 'test_api_key',
      fetchFn,
      baseUrl: '',
    });

    await expect(
      client.searchLibraries({ pref: '東京都' }),
    ).rejects.toBeInstanceOf(CalilHttpException);
  });
});
