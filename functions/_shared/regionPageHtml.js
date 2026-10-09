/**
 * 地域ページの内容（`src/presentation/regionPage/regionPageContent.ts` が
 * 組み立てたもの）を、配信 HTML に差し込む文字列へ変換する（#182）。
 *
 * - `renderRootHtml`: `<div id="root">` に差し込む本文。JS を実行しない
 *   クローラにも h1・パンくず・図書館一覧・内部リンクが見えるようにする。
 *   JS が動く環境では、SPA の `createRoot().render()` がこの中身を置き換える。
 * - `renderJsonLd`: `<script type="application/ld+json">` の中身。
 *
 * 地名は URL 由来、館名・住所はカーリル由来の文字列のため、HTML には必ず
 * `escapeHtml` を通し、JSON-LD は `<` をエスケープして `</script>` で
 * script 要素が閉じられないようにする。
 */
import {
  buildPrefectureIndexContent,
  regionPath,
} from '../../src/presentation/regionPage/regionPageContent.ts';

const SITE_ORIGIN = 'https://libcheck.app';

/** 移動図書館は固定の所在地を持たないため、構造化データの Library に含めない。 */
const MOBILE_LIBRARY_CATEGORY = 'BM';

// JS 起動までの短い間だけ表示される本文の最小限の見た目。SPA の描画で丸ごと
// 置き換わるため、切り替わりの差が目立たないようアプリの配色トークン
// （src/presentation/theme/tokens.ts の KC_COLORS）に合わせる。
// CSP は style-src 'unsafe-inline' を許可済み。
const STYLE =
  '<style>' +
  'body{background:#F4F1E8}' +
  '.lc-static{max-width:720px;margin:0 auto;padding:16px;font-family:system-ui,sans-serif;line-height:1.6;color:#23302D}' +
  '.lc-static a{color:#00796B}' +
  '.lc-static p{color:#5A6360}' +
  '.lc-static ol{list-style:none;display:flex;flex-wrap:wrap;gap:4px;padding:0;margin:0 0 8px;font-size:.85rem}' +
  '.lc-static ol li+li::before{content:"/";margin-right:4px;color:#5A6360}' +
  '.lc-static h1{font-size:1.25rem;margin:8px 0}' +
  '.lc-static h2{font-size:1.05rem;margin:20px 0 8px}' +
  '.lc-static h3{font-size:.85rem;margin:12px 0 4px;color:#5A6360}' +
  '.lc-static ul{padding-left:1.2em}' +
  '</style>';

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function link(path, text) {
  return `<a href="${escapeHtml(path)}">${escapeHtml(text)}</a>`;
}

function renderBreadcrumbs(items) {
  const lis = items.map((item, i) =>
    i === items.length - 1
      ? `<li aria-current="page">${escapeHtml(item.name)}</li>`
      : `<li>${link(item.path, item.name)}</li>`,
  );
  return `<nav aria-label="パンくずリスト"><ol>${lis.join('')}</ol></nav>`;
}

function renderCityLinks(cities) {
  const lis = cities.map((c) => `<li>${link(c.path, `${c.name}（${c.libraryCount}館）`)}</li>`);
  return `<ul>${lis.join('')}</ul>`;
}

function renderRegions(regions) {
  return regions
    .map((region) => {
      const lis = region.prefectures.map((p) => `<li>${link(p.path, p.name)}</li>`);
      return `<h3>${escapeHtml(region.name)}</h3><ul>${lis.join('')}</ul>`;
    })
    .join('');
}

function renderLibraries(libraries) {
  const lis = libraries.map(
    (l) => `<li><strong>${escapeHtml(l.name)}</strong><br>${escapeHtml(l.address)}</li>`,
  );
  // カーリル API 由来の図書館名を表示する画面にはカーリルへのリンクが必要（#156）。
  return (
    `<ul>${lis.join('')}</ul>` +
    `<p>図書館情報の提供: <a href="https://calil.jp/">カーリル</a></p>`
  );
}

/**
 * 体験版（#183）の入口。結果の表示は JS（SPA）が行うため、JS 非実行時は
 * 送信しても何も起きないことを noscript で伝える。
 */
function renderTrialForm(trial) {
  return (
    `<h2>${escapeHtml(trial.heading)}</h2>` +
    `<p>${escapeHtml(trial.description)}</p>` +
    // インラインのイベントハンドラは CSP（script-src に 'unsafe-inline' なし）で
    // 禁止のため付けない。JS 非実行時に送信しても同じページが再読み込みされるだけ。
    '<form>' +
    '<label>ISBN <input name="isbn" inputmode="numeric" autocomplete="off" maxlength="17" placeholder="978…"></label> ' +
    '<button type="submit">この地域の図書館で調べる</button>' +
    '</form>' +
    '<noscript><p>JavaScript を有効にすると調べられます。</p></noscript>'
  );
}

function main(inner) {
  return `${STYLE}<main class="lc-static">${inner}</main>`;
}

export function renderRootHtml(content) {
  switch (content.kind) {
    case 'city':
      return main(
        renderBreadcrumbs(content.breadcrumbs) +
          `<h1>${escapeHtml(content.h1)}</h1>` +
          `<p>${escapeHtml(content.description)}</p>` +
          renderTrialForm(content.trial) +
          `<h2>掲載している図書館</h2>${renderLibraries(content.libraries)}` +
          (content.otherCities.length > 0
            ? `<h2>${escapeHtml(content.pref)}の他の市区町村</h2>${renderCityLinks(content.otherCities)}`
            : ''),
      );
    case 'prefecture':
      return main(
        renderBreadcrumbs(content.breadcrumbs) +
          `<h1>${escapeHtml(content.h1)}</h1>` +
          `<p>${escapeHtml(content.description)}</p>` +
          `<h2>市区町村から選ぶ</h2>${renderCityLinks(content.cities)}`,
      );
    case 'index':
      return main(
        renderBreadcrumbs(content.breadcrumbs) +
          `<h1>${escapeHtml(content.h1)}</h1>` +
          `<p>${escapeHtml(content.description)}</p>` +
          renderRegions(content.regions),
      );
    default:
      return main(
        `<h1>${escapeHtml(content.h1)}</h1>` +
          `<p>${link(regionPath(), '対応している図書館を都道府県から探す')}</p>`,
      );
  }
}

/** トップページ `/` の `#root` に差し込む本文（`<head>` は変更しない）。 */
export function renderTopRootHtml() {
  const index = buildPrefectureIndexContent();
  return main(
    '<h1>LibCheck</h1>' +
      '<p>本のバーコードを読み取るだけで、登録した図書館で借りられるか・予約できるかをまとめて確認できるアプリです。</p>' +
      '<h2>対応している図書館を地域から探す</h2>' +
      `<p>${link(regionPath(), '都道府県から探す')}</p>` +
      renderRegions(index.regions),
  );
}

function breadcrumbJsonLd(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => {
      const entry = { '@type': 'ListItem', position: i + 1, name: item.name };
      // 最後の項目は item を省略する（Google のガイドで省略可）。
      if (i < items.length - 1) entry.item = `${SITE_ORIGIN}${item.path}`;
      return entry;
    }),
  };
}

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

/** カーリルの geocode は「経度,緯度」の順。解釈できなければ undefined。 */
function parseGeocode(geocode) {
  if (typeof geocode !== 'string') return undefined;
  const [longitude, latitude] = geocode.split(',').map(Number);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  return { '@type': 'GeoCoordinates', latitude, longitude };
}

function libraryJsonLd(library, pref, city) {
  const node = {
    '@type': 'Library',
    name: library.name,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'JP',
      addressRegion: pref,
      addressLocality: city,
      streetAddress: library.address,
    },
  };
  if (library.tel) node.telephone = library.tel;
  if (isHttpUrl(library.url)) node.url = library.url;
  const geo = parseGeocode(library.geocode);
  if (geo) node.geo = geo;
  return node;
}

/**
 * ページ内容の JSON-LD 文字列。`notFound` は構造化データを出さないため null。
 */
export function renderJsonLd(content) {
  if (content.kind === 'notFound') return null;

  const graph = [breadcrumbJsonLd(content.breadcrumbs)];
  if (content.kind === 'city') {
    for (const library of content.libraries) {
      if (library.category === MOBILE_LIBRARY_CATEGORY) continue;
      graph.push(libraryJsonLd(library, content.pref, content.city));
    }
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll(
    '<',
    '\\u003c',
  );
}
