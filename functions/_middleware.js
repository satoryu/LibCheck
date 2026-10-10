/**
 * ルート直下の Pages Functions ミドルウェア（#157）。
 *
 * 最初に、Cloudflare Pages の既定ドメイン `libcheck.pages.dev` へのリクエストを
 * 本番ドメインへ転送する（#189）。以降は本番・プレビュー・ローカルでの処理。
 *
 * URL に応じて配信 HTML の `<head>` と、地域ページでは本文（`#root`）も
 * 書き換える。`/api/*` と非HTMLレスポンス（静的アセット）は `next()` の結果を
 * そのまま返し、一切手を加えない。`HTMLRewriter` が Pages Functions で動くことは
 * `npx wrangler pages dev` によるローカルエミュレーションで実機検証済み
 * （docs/157-seo-foundation/design.md）。
 *
 * - `/`: `<head>` は #151 で作り込んだ既定メタ（`SoftwareApplication` を含む）の
 *   まま。`#root` にだけ地域ページへのリンクを差し込む（#182）。
 * - 地域ページ（`/library/add` 以下）: 静的な図書館データ（`/data/libraries/{pref}.json`）
 *   から title / description / canonical / OGP / JSON-LD / 本文を組み立てて差し込む
 *   （#182。JS を実行しないクローラにも本文が見えるようにする。JS が動く環境では
 *   SPA が `#root` を同じ内容で置き換える）。データにない地域は `noindex`。
 * - 使い方ガイド（`/guide/*`、静的ページ）: 手を加えない（#184）。
 * - 個人向けページ・未知のパス: `noindex`（#157）。
 */
import { findRouteMeta } from './_shared/routeMeta.js';
import { renderJsonLd, renderRootHtml, renderTopRootHtml } from './_shared/regionPageHtml.js';
import {
  buildCityPageContent,
  buildPrefectureIndexContent,
  buildPrefecturePageContent,
  isKnownPrefecture,
} from '../src/presentation/regionPage/regionPageContent.ts';

const SITE_ORIGIN = 'https://libcheck.app';

/**
 * Cloudflare Pages の既定ドメイン（#189）。本番と同じデプロイを配信してしまうため、
 * 本番ドメインへ転送する。デプロイごとの URL（`<ハッシュ>.libcheck.pages.dev`）や
 * ブランチ別の URL は検証に使うので、完全一致で判定して転送しない。
 */
const PAGES_DEV_HOST = 'libcheck.pages.dev';

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  const redirect = redirectToCanonicalHost(request, url);
  if (redirect) return redirect;

  if (url.pathname.startsWith('/api/')) {
    return next();
  }

  const response = await next();
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  if (url.pathname === '/') {
    return new HTMLRewriter()
      .on('#root', {
        element(el) {
          el.setInnerContent(renderTopRootHtml(), { html: true });
        },
      })
      .transform(response);
  }

  const routeMeta = findRouteMeta(url.pathname);
  if (routeMeta?.static) {
    // 使い方ガイド（#184）の静的ページ。メタ情報はページ自身が持つ。
    return response;
  }
  if (routeMeta === null) {
    // 未知のパスも安全側で noindex にする。
    return new HTMLRewriter()
      .on('meta[name="robots"]', {
        element(el) {
          el.setAttribute('content', 'noindex');
        },
      })
      .transform(response);
  }

  const canonicalUrl = `${SITE_ORIGIN}${url.pathname}`;

  if (routeMeta.region !== undefined) {
    const content = await loadRegionContent(routeMeta, context);
    if (content === null) {
      // 図書館データを一時的に取得できなかった。実在するページを noindex に
      // しないよう内容の書き換えは諦め、canonical だけ自身に向ける
      // （index.html 既定の canonical はトップを指しているため）。
      return rewriteCanonical(new HTMLRewriter(), canonicalUrl).transform(response);
    }
    return rewriteRegionPage(response, content, canonicalUrl);
  }

  // 個人向けページ等、未ログインでは公開していないルート（#157）。
  return new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(routeMeta.title);
      },
    })
    .on('meta[property="og:title"]', {
      element(el) {
        el.setAttribute('content', routeMeta.title);
      },
    })
    .on('meta[name="robots"]', {
      element(el) {
        el.setAttribute('content', 'noindex');
      },
    })
    .transform(response);
}

/**
 * `libcheck.pages.dev` へのリクエストを、同じパス・クエリのまま本番ドメインへ転送する。
 * GET / HEAD は 301（恒久的な移動）、それ以外は 308（301 だとブラウザが POST を GET に
 * 変えることがあるため、メソッドと本文を保つ）。対象外なら null。
 */
function redirectToCanonicalHost(request, url) {
  if (url.hostname !== PAGES_DEV_HOST) return null;
  const status = request.method === 'GET' || request.method === 'HEAD' ? 301 : 308;
  return Response.redirect(`${SITE_ORIGIN}${url.pathname}${url.search}`, status);
}

/**
 * 地域ページの内容を組み立てる。図書館データを取得できなかった場合は null。
 * 未知の都道府県・データにない市区町村は `kind: 'notFound'` になる。
 */
async function loadRegionContent({ region, params }, context) {
  if (region === 'index') return buildPrefectureIndexContent();

  // 未知の都道府県は SPA フォールバックで index.html が返るため、取得前に弾く。
  const libraries = isKnownPrefecture(params.pref)
    ? await fetchPrefectureLibraries(params.pref, context)
    : [];
  if (libraries === null) return null;

  return region === 'city'
    ? buildCityPageContent(params.pref, params.city, libraries)
    : buildPrefecturePageContent(params.pref, libraries);
}

async function fetchPrefectureLibraries(pref, { env, request }) {
  const dataUrl = new URL(`/data/libraries/${encodeURIComponent(pref)}.json`, request.url);
  try {
    const res = await env.ASSETS.fetch(dataUrl);
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !type.includes('json')) {
      throw new Error(`HTTP ${res.status} (${type})`);
    }
    const libraries = await res.json();
    if (!Array.isArray(libraries)) throw new Error('配列ではない');
    return libraries;
  } catch (err) {
    console.error(`図書館データの取得に失敗しました（${pref}）: ${err}`);
    return null;
  }
}

function rewriteCanonical(rewriter, canonicalUrl) {
  return rewriter
    .on('link[rel="canonical"]', {
      element(el) {
        el.setAttribute('href', canonicalUrl);
      },
    })
    .on('meta[property="og:url"]', {
      element(el) {
        el.setAttribute('content', canonicalUrl);
      },
    });
}

function rewriteRegionPage(response, content, canonicalUrl) {
  const jsonLd = renderJsonLd(content);
  const rewriter = new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(content.title);
      },
    })
    .on('meta[property="og:title"]', {
      element(el) {
        el.setAttribute('content', content.title);
      },
    })
    .on('script[type="application/ld+json"]', {
      element(el) {
        // トップの SoftwareApplication を、このページの構造化データに置き換える。
        // JSON-LD は renderJsonLd が `<` をエスケープ済みのため html: true で入れる
        // （text 扱いだと `&` 等がエンティティ化され JSON が壊れる）。
        if (jsonLd === null) el.remove();
        else el.setInnerContent(jsonLd, { html: true });
      },
    })
    .on('#root', {
      element(el) {
        el.setInnerContent(renderRootHtml(content), { html: true });
      },
    });

  if (content.kind === 'notFound') {
    // 0館（データにない地域）のページ。薄いページとして評価されないよう noindex。
    // canonical は index.html 既定（トップ）のままだと noindex と食い違うため自身に向ける。
    return rewriteCanonical(rewriter, canonicalUrl)
      .on('meta[name="robots"]', {
        element(el) {
          el.setAttribute('content', 'noindex');
        },
      })
      .transform(response);
  }

  // robots は index.html の既定値（index,follow）のままでよいため触らない。
  return rewriteCanonical(rewriter, canonicalUrl)
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute('content', content.description);
      },
    })
    .on('meta[property="og:description"]', {
      element(el) {
        el.setAttribute('content', content.description);
      },
    })
    .transform(response);
}
