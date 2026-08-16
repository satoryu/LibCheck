/**
 * ルート直下の Pages Functions ミドルウェア（#157）。
 *
 * URL に応じて配信 HTML の `<title>` / `<meta name="robots">` を書き換える。
 * `/api/*` と非HTMLレスポンス（静的アセット）は `next()` の結果をそのまま
 * 返し、一切手を加えない。`HTMLRewriter` が Pages Functions で動くことは
 * `npx wrangler pages dev` によるローカルエミュレーションで実機検証済み
 * （docs/157-seo-foundation/design.md）。
 *
 * `/` はエントリを持たないため無変更で返す（#151 で作り込んだ既定メタを
 * そのまま使う。ランディングは元々公開・indexable）。それ以外の既知ルート・
 * 未知のパスはすべて `noindex` を付与する（#157 時点ではどのルートも実際には
 * 未ログインで公開していないため）。
 */
import { findRouteMeta } from './_shared/routeMeta.js';

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    return next();
  }

  const response = await next();
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  if (url.pathname === '/') {
    return response;
  }

  const meta = findRouteMeta(url.pathname);
  const rewriter = new HTMLRewriter().on('meta[name="robots"]', {
    element(el) {
      el.setAttribute('content', 'noindex');
    },
  });

  if (meta !== null) {
    rewriter
      .on('title', {
        element(el) {
          el.setInnerContent(meta.title);
        },
      })
      .on('meta[property="og:title"]', {
        element(el) {
          el.setAttribute('content', meta.title);
        },
      });
  }

  return rewriter.transform(response);
}
