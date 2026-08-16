// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `HTMLRewriter` は Cloudflare Workers ランタイムのグローバル API で、Node の
 * テスト環境には存在しない。実際の DOM 書き換え（title/robots の属性変更）は
 * `npx wrangler pages dev` によるローカルエミュレーションで実機検証済み
 * （docs/157-seo-foundation/design.md）。ここでは `_middleware.js` 自身の
 * 制御フロー（/api/* の素通し・非HTMLの素通し・どのセレクタを登録するか）を
 * 軽量フェイクで検証する。
 */
class FakeHTMLRewriter {
  handlers: { selector: string }[] = [];
  on(selector: string): this {
    this.handlers.push({ selector });
    return this;
  }
  transform(response: Response): Response {
    // 実際の書き換えは行わず、どのセレクタを登録したかを検証できるよう
    // レスポンスに付随情報を載せて返す。
    (response as unknown as { __rewriterSelectors: string[] }).__rewriterSelectors =
      this.handlers.map((h) => h.selector);
    return response;
  }
}

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

  it('/ は HTMLRewriter を適用せず next() の結果をそのまま返す（#151の既定メタを維持）', async () => {
    globalThis.HTMLRewriter = FakeHTMLRewriter as unknown as typeof HTMLRewriter;
    const { onRequest } = await importMiddleware();

    const rootResponse = htmlResponse();
    const next = vi.fn(async () => rootResponse);

    const res = await onRequest({
      request: new Request('https://libcheck.app/'),
      next,
    } as never);

    expect(res).toBe(rootResponse);
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
