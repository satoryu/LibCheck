// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `HTMLRewriter` は Cloudflare Workers ランタイムのグローバル API で、Node の
 * テスト環境には存在しない。実際の DOM 書き換えは `npx wrangler pages dev`
 * によるローカルエミュレーションで実機検証する（docs/157-seo-foundation/design.md、
 * docs/182-region-page-structure/design.md）。ここでは軽量フェイクで、
 * どのセレクタにどんな書き換え（属性・中身・削除）を登録したかを検証する。
 */
interface ElementOps {
  attrs: Record<string, string>;
  inner?: { content: string; html: boolean };
  removed: boolean;
}

class FakeHTMLRewriter {
  handlers: { selector: string; element: (el: unknown) => void }[] = [];
  on(selector: string, handler: { element: (el: unknown) => void }): this {
    this.handlers.push({ selector, element: handler.element });
    return this;
  }
  transform(response: Response): Response {
    // 各ハンドラをフェイク要素に適用し、結果をレスポンスに載せて返す。
    const ops: Record<string, ElementOps> = {};
    for (const { selector, element } of this.handlers) {
      const op: ElementOps = (ops[selector] ??= { attrs: {}, removed: false });
      element({
        setAttribute: (name: string, value: string) => {
          op.attrs[name] = value;
        },
        setInnerContent: (content: string, options?: { html?: boolean }) => {
          op.inner = { content, html: options?.html ?? false };
        },
        remove: () => {
          op.removed = true;
        },
      });
    }
    Object.assign(response, {
      __rewriterSelectors: this.handlers.map((h) => h.selector),
      __ops: ops,
    });
    return response;
  }
}

type RewrittenResponse = Response & {
  __rewriterSelectors: string[];
  __ops: Record<string, ElementOps>;
};

const SHIGA_LIBRARIES = [
  {
    systemId: 'Shiga_Yasu',
    systemName: '滋賀県野洲市',
    libKey: '野洲',
    libId: '1',
    shortName: '野洲図書館',
    formalName: '野洲市野洲図書館',
    address: '滋賀県野洲市辻町410',
    pref: '滋賀県',
    city: '野洲市',
    category: 'MEDIUM',
  },
  {
    systemId: 'Shiga_Otsu',
    systemName: '滋賀県大津市',
    libKey: '大津',
    libId: '2',
    shortName: '大津図書館',
    formalName: '大津市立図書館',
    address: '滋賀県大津市1-1',
    pref: '滋賀県',
    city: '大津市',
    category: 'MEDIUM',
  },
];

/** `env.ASSETS` のフェイク。都道府県 JSON を返す。 */
function assetsEnv(
  respond: () => Promise<Response> = async () =>
    new Response(JSON.stringify(SHIGA_LIBRARIES), {
      headers: { 'content-type': 'application/json' },
    }),
) {
  const fetch = vi.fn(async (_url: URL) => respond());
  return { env: { ASSETS: { fetch } }, fetch };
}

const PREF = encodeURIComponent('滋賀県');
const CITY = encodeURIComponent('野洲市');

async function importMiddleware() {
  // 各テストでフェイクを差し替えるため、グローバル設定後に動的 import する。
  return import('./_middleware.js');
}

function htmlResponse(): Response {
  return new Response('<html><head><title>x</title></head></html>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  delete (globalThis as { HTMLRewriter?: unknown }).HTMLRewriter;
});

describe('_middleware.js', () => {
  it('/api/ 配下は next() の結果をそのまま返す（HTMLRewriter に触れない）', async () => {
    globalThis.HTMLRewriter = FakeHTMLRewriter as unknown as typeof HTMLRewriter;
    const { onRequest } = await importMiddleware();

    const apiResponse = new Response('unauthorized', { status: 401 });
    const next = vi.fn(async () => apiResponse);

    const res = await onRequest({
      request: new Request('https://libcheck.app/api/me'),
      next,
    } as never);

    expect(res).toBe(apiResponse);
    expect(next).toHaveBeenCalledOnce();
  });

  it('text/html 以外（静的アセット）は next() の結果をそのまま返す', async () => {
    globalThis.HTMLRewriter = FakeHTMLRewriter as unknown as typeof HTMLRewriter;
    const { onRequest } = await importMiddleware();

    const jsResponse = new Response('console.log(1)', {
      headers: { 'content-type': 'application/javascript' },
    });
    const next = vi.fn(async () => jsResponse);

    const res = await onRequest({
      request: new Request('https://libcheck.app/assets/index-abc.js'),
      next,
    } as never);

    expect(res).toBe(jsResponse);
  });

  it('/ は head を変えず、#root にだけ地域ページへのリンクを差し込む（#182）', async () => {
    globalThis.HTMLRewriter = FakeHTMLRewriter as unknown as typeof HTMLRewriter;
    const { onRequest } = await importMiddleware();
    const { env, fetch } = assetsEnv();

    const res = (await onRequest({
      request: new Request('https://libcheck.app/'),
      next: vi.fn(async () => htmlResponse()),
      env,
    } as never)) as RewrittenResponse;

    expect(res.__rewriterSelectors).toEqual(['#root']);
    expect(res.__ops['#root'].inner?.html).toBe(true);
    expect(res.__ops['#root'].inner?.content).toContain('href="/library/add"');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('既知の非公開ルートは robots と title のセレクタを登録して書き換える', async () => {
    globalThis.HTMLRewriter = FakeHTMLRewriter as unknown as typeof HTMLRewriter;
    const { onRequest } = await importMiddleware();

    const next = vi.fn(async () => htmlResponse());

    const res = (await onRequest({
      request: new Request('https://libcheck.app/history'),
      next,
    } as never)) as Response & { __rewriterSelectors: string[] };

    expect(res.__rewriterSelectors).toContain('meta[name="robots"]');
    expect(res.__rewriterSelectors).toContain('title');
  });

  it('非公開ルートは canonical/description を書き換えない（#158）', async () => {
    globalThis.HTMLRewriter = FakeHTMLRewriter as unknown as typeof HTMLRewriter;
    const { onRequest } = await importMiddleware();

    const next = vi.fn(async () => htmlResponse());

    const res = (await onRequest({
      request: new Request('https://libcheck.app/history'),
      next,
    } as never)) as Response & { __rewriterSelectors: string[] };

    expect(res.__rewriterSelectors).not.toContain('link[rel="canonical"]');
    expect(res.__rewriterSelectors).not.toContain('meta[name="description"]');
  });

  describe('地域ページ（#182）', () => {
    it('市区町村ページ: 図書館データから title/description/canonical/OGP/JSON-LD/本文を書き換える', async () => {
      globalThis.HTMLRewriter = FakeHTMLRewriter as unknown as typeof HTMLRewriter;
      const { onRequest } = await importMiddleware();
      const { env, fetch } = assetsEnv();
      const url = `https://libcheck.app/library/add/${PREF}/${CITY}`;

      const res = (await onRequest({
        request: new Request(url),
        next: vi.fn(async () => htmlResponse()),
        env,
      } as never)) as RewrittenResponse;

      expect(String(fetch.mock.calls[0][0])).toBe(`https://libcheck.app/data/libraries/${PREF}.json`);
      expect(res.__ops['title'].inner?.content).toBe(
        '滋賀県野洲市の図書館に対応｜本のバーコードで予約可否をチェック — LibCheck',
      );
      expect(res.__ops['meta[name="description"]'].attrs.content).toContain('野洲市野洲図書館');
      expect(res.__ops['meta[property="og:description"]'].attrs.content).toContain('野洲市野洲図書館');
      expect(res.__ops['link[rel="canonical"]'].attrs.href).toBe(url);
      expect(res.__ops['meta[property="og:url"]'].attrs.content).toBe(url);
      const ld = res.__ops['script[type="application/ld+json"]'].inner;
      expect(ld?.html).toBe(true);
      expect(JSON.parse(ld?.content ?? '')['@graph'].map((n: { '@type': string }) => n['@type'])).toEqual([
        'BreadcrumbList',
        'Library',
      ]);
      expect(res.__ops['#root'].inner?.content).toContain('<h1>滋賀県野洲市の図書館（1館）</h1>');
      // 実在する地域は index のまま（index.html 既定の robots を触らない）。
      expect(res.__rewriterSelectors).not.toContain('meta[name="robots"]');
    });

    it('都道府県ページ: 都道府県 JSON から内容を組み立てる', async () => {
      globalThis.HTMLRewriter = FakeHTMLRewriter as unknown as typeof HTMLRewriter;
      const { onRequest } = await importMiddleware();
      const { env } = assetsEnv();

      const res = (await onRequest({
        request: new Request(`https://libcheck.app/library/add/${PREF}`),
        next: vi.fn(async () => htmlResponse()),
        env,
      } as never)) as RewrittenResponse;

      expect(res.__ops['title'].inner?.content).toContain('滋賀県の図書館に対応');
      expect(res.__ops['#root'].inner?.content).toContain('<h1>滋賀県の図書館（2市区町村・2館）</h1>');
      expect(res.__rewriterSelectors).not.toContain('meta[name="robots"]');
    });

    it('/library/add: 図書館データを読まずに都道府県一覧を組み立てる', async () => {
      globalThis.HTMLRewriter = FakeHTMLRewriter as unknown as typeof HTMLRewriter;
      const { onRequest } = await importMiddleware();
      const { env, fetch } = assetsEnv();

      const res = (await onRequest({
        request: new Request('https://libcheck.app/library/add'),
        next: vi.fn(async () => htmlResponse()),
        env,
      } as never)) as RewrittenResponse;

      expect(fetch).not.toHaveBeenCalled();
      expect(res.__ops['title'].inner?.content).toBe('対応している図書館を都道府県から探す — LibCheck');
      expect(res.__ops['#root'].inner?.content).toContain('<h1>対応している図書館を都道府県から探す</h1>');
    });

    it('データにない市区町村（0館）は noindex にし、構造化データを除く', async () => {
      globalThis.HTMLRewriter = FakeHTMLRewriter as unknown as typeof HTMLRewriter;
      const { onRequest } = await importMiddleware();
      const { env } = assetsEnv();

      const res = (await onRequest({
        request: new Request(`https://libcheck.app/library/add/${PREF}/${encodeURIComponent('存在しない市')}`),
        next: vi.fn(async () => htmlResponse()),
        env,
      } as never)) as RewrittenResponse;

      expect(res.__ops['meta[name="robots"]'].attrs.content).toBe('noindex');
      expect(res.__ops['script[type="application/ld+json"]'].removed).toBe(true);
      expect(res.__ops['#root'].inner?.content).toContain('この地域の図書館は見つかりませんでした');
      // noindex と「正規 URL はトップ」（index.html 既定）が食い違わないよう、自身に向ける。
      expect(res.__ops['link[rel="canonical"]'].attrs.href).toBe(
        `https://libcheck.app/library/add/${PREF}/${encodeURIComponent('存在しない市')}`,
      );
    });

    it('未知の都道府県は図書館データを読まずに noindex にする', async () => {
      globalThis.HTMLRewriter = FakeHTMLRewriter as unknown as typeof HTMLRewriter;
      const { onRequest } = await importMiddleware();
      const { env, fetch } = assetsEnv();

      const res = (await onRequest({
        request: new Request(`https://libcheck.app/library/add/${encodeURIComponent('滋賀')}`),
        next: vi.fn(async () => htmlResponse()),
        env,
      } as never)) as RewrittenResponse;

      expect(fetch).not.toHaveBeenCalled();
      expect(res.__ops['meta[name="robots"]'].attrs.content).toBe('noindex');
    });

    it.each([
      ['JSON 以外（SPA フォールバックの HTML）', async () => htmlResponse()],
      ['HTTP エラー', async () => new Response('error', { status: 500 })],
      ['例外', async () => Promise.reject(new Error('network'))],
    ])('図書館データを取得できない場合（%s）は noindex にせず、canonical だけ自身に向ける', async (_label, respond) => {
      globalThis.HTMLRewriter = FakeHTMLRewriter as unknown as typeof HTMLRewriter;
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const { onRequest } = await importMiddleware();
      const { env } = assetsEnv(respond);
      const url = `https://libcheck.app/library/add/${PREF}/${CITY}`;

      const res = (await onRequest({
        request: new Request(url),
        next: vi.fn(async () => htmlResponse()),
        env,
      } as never)) as RewrittenResponse;

      // 一時的な取得失敗で実在ページを noindex にしない。
      expect(res.__rewriterSelectors).not.toContain('meta[name="robots"]');
      expect(res.__ops['link[rel="canonical"]'].attrs.href).toBe(url);
      expect(res.__ops['meta[property="og:url"]'].attrs.content).toBe(url);
    });
  });

  it('使い方ガイド（静的ページ）は HTMLRewriter を適用せずそのまま返す（#184）', async () => {
    globalThis.HTMLRewriter = FakeHTMLRewriter as unknown as typeof HTMLRewriter;
    const { onRequest } = await importMiddleware();
    const guideResponse = htmlResponse();

    const res = await onRequest({
      request: new Request('https://libcheck.app/guide/bookstore'),
      next: vi.fn(async () => guideResponse),
    } as never);

    expect(res).toBe(guideResponse);
    // 未知のパス扱い（robots を noindex に書き換える）にもならない。
    expect((res as RewrittenResponse).__rewriterSelectors).toBeUndefined();
  });

  it('未知のパスも安全側で robots セレクタを登録する（noindex にする）', async () => {
    globalThis.HTMLRewriter = FakeHTMLRewriter as unknown as typeof HTMLRewriter;
    const { onRequest } = await importMiddleware();

    const next = vi.fn(async () => htmlResponse());

    const res = (await onRequest({
      request: new Request('https://libcheck.app/no-such-route'),
      next,
    } as never)) as Response & { __rewriterSelectors: string[] };

    expect(res.__rewriterSelectors).toContain('meta[name="robots"]');
  });
});
