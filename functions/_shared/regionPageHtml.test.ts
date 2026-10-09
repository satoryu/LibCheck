// @vitest-environment node
import { describe, expect, it } from 'vitest';

import type { Library } from '../../src/domain/models/library';
import {
  buildCityPageContent,
  buildPrefectureIndexContent,
  buildPrefecturePageContent,
  regionPath,
} from '../../src/presentation/regionPage/regionPageContent';
import { escapeHtml, renderJsonLd, renderRootHtml, renderTopRootHtml } from './regionPageHtml.js';

function lib(overrides: Partial<Library> & Pick<Library, 'city' | 'formalName'>): Library {
  return {
    systemId: 'Shiga_Yasu',
    systemName: '滋賀県野洲市',
    libKey: overrides.formalName,
    libId: overrides.formalName,
    shortName: overrides.formalName,
    address: `滋賀県${overrides.city}1-1`,
    pref: '滋賀県',
    category: 'MEDIUM',
    ...overrides,
  };
}

const SHIGA: Library[] = [
  lib({
    city: '野洲市',
    formalName: '野洲市野洲図書館',
    address: '滋賀県野洲市辻町410',
    tel: '077-586-0218',
    url: 'https://www.iw.licsre-saas.jp/yasu/',
    geocode: '136.03,35.06',
  }),
  lib({ city: '野洲市', formalName: '移動図書館ひまわり号', category: 'BM' }),
  lib({ city: '大津市', formalName: '大津市立図書館' }),
];

function cityContent() {
  const content = buildCityPageContent('滋賀県', '野洲市', SHIGA);
  if (content.kind !== 'city') throw new Error('city を期待');
  return content;
}

function parseJsonLd(json: string) {
  return JSON.parse(json) as { '@context': string; '@graph': Record<string, unknown>[] };
}

describe('escapeHtml', () => {
  it('HTML の特殊文字をエスケープする', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });
});

describe('renderRootHtml', () => {
  it('市区町村ページ: h1・パンくず・図書館一覧・クレジット・他の市区町村リンクを含む', () => {
    const html = renderRootHtml(cityContent());

    expect(html).toContain('<h1>滋賀県野洲市の図書館（2館）</h1>');
    expect(html).toContain('<nav aria-label="パンくずリスト">');
    expect(html).toContain('<a href="/">トップ</a>');
    expect(html).toContain(`<a href="${regionPath()}">都道府県から探す</a>`);
    expect(html).toContain(`<a href="${regionPath('滋賀県')}">滋賀県</a>`);
    // 現在のページはリンクにしない。
    expect(html).toContain('<li aria-current="page">野洲市</li>');
    expect(html).toContain('野洲市野洲図書館');
    expect(html).toContain('滋賀県野洲市辻町410');
    expect(html).toContain('<a href="https://calil.jp/">カーリル</a>');
    expect(html).toContain('滋賀県の他の市区町村');
    expect(html).toContain(`<a href="${regionPath('滋賀県', '大津市')}">大津市（1館）</a>`);
  });

  it('市区町村ページ: 体験版（#183）の見出し・説明・ISBN 入力欄を、図書館一覧より前に含む', () => {
    const html = renderRootHtml(cityContent());

    expect(html).toContain('<h2>この本、野洲市の図書館で借りられる？</h2>');
    expect(html).toContain('ログインせずに1冊調べられます');
    expect(html).toMatch(/<input[^>]+name="isbn"/);
    expect(html).toContain('この地域の図書館で調べる');
    expect(html).toContain('<noscript>');
    // インラインのイベントハンドラは CSP 違反になるため使わない。
    expect(html).not.toMatch(/\son[a-z]+=/);
    expect(html.indexOf('借りられる？')).toBeLessThan(html.indexOf('掲載している図書館'));
  });

  it('都道府県ページ: h1 と館数付きの市区町村リンクを含む', () => {
    const content = buildPrefecturePageContent('滋賀県', SHIGA);
    if (content.kind !== 'prefecture') throw new Error('prefecture を期待');
    const html = renderRootHtml(content);

    expect(html).toContain('<h1>滋賀県の図書館（2市区町村・3館）</h1>');
    expect(html).toContain(`<a href="${regionPath('滋賀県', '野洲市')}">野洲市（2館）</a>`);
    expect(html).toContain('<li aria-current="page">滋賀県</li>');
  });

  it('/library/add: 47都道府県へのリンクを含む', () => {
    const html = renderRootHtml(buildPrefectureIndexContent());

    expect(html).toContain('<h1>対応している図書館を都道府県から探す</h1>');
    expect(html.match(/<a href="\/library\/add\/[^"]+">/g)).toHaveLength(47);
  });

  it('notFound: h1 と都道府県一覧へのリンクを含む', () => {
    const html = renderRootHtml(buildCityPageContent('滋賀県', '存在しない市', SHIGA));

    expect(html).toContain('<h1>この地域の図書館は見つかりませんでした</h1>');
    expect(html).toContain(`<a href="${regionPath()}">`);
  });

  it('館名・住所に含まれる HTML を無害化する', () => {
    const evil = [lib({ city: '野洲市', formalName: '<img src=x onerror=alert(1)>', address: '"><script>' })];
    const content = buildCityPageContent('滋賀県', '野洲市', evil);
    const html = renderRootHtml(content);

    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});

describe('renderTopRootHtml', () => {
  it('アプリの説明と、都道府県一覧・47都道府県へのリンクを含む', () => {
    const html = renderTopRootHtml();

    expect(html).toContain('<h1>LibCheck</h1>');
    expect(html).toContain(`<a href="${regionPath()}">`);
    expect(html.match(/<a href="\/library\/add\/[^"]+">/g)).toHaveLength(47);
    expect(html).not.toContain('蔵書検索');
  });
});

describe('renderJsonLd', () => {
  it('市区町村ページ: BreadcrumbList と Library（移動図書館を除く）を @graph に持つ', () => {
    const ld = parseJsonLd(renderJsonLd(cityContent()));

    expect(ld['@context']).toBe('https://schema.org');
    const [breadcrumb, ...libraries] = ld['@graph'];
    expect(breadcrumb).toEqual({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://libcheck.app/' },
        { '@type': 'ListItem', position: 2, name: '都道府県から探す', item: `https://libcheck.app${regionPath()}` },
        { '@type': 'ListItem', position: 3, name: '滋賀県', item: `https://libcheck.app${regionPath('滋賀県')}` },
        // 最後の項目は item を省略する（Google のガイドで省略可。ページ自身の URL が使われる）。
        { '@type': 'ListItem', position: 4, name: '野洲市' },
      ],
    });
    expect(libraries).toEqual([
      {
        '@type': 'Library',
        name: '野洲市野洲図書館',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'JP',
          addressRegion: '滋賀県',
          addressLocality: '野洲市',
          streetAddress: '滋賀県野洲市辻町410',
        },
        telephone: '077-586-0218',
        url: 'https://www.iw.licsre-saas.jp/yasu/',
        // geocode は「経度,緯度」の順。
        geo: { '@type': 'GeoCoordinates', latitude: 35.06, longitude: 136.03 },
      },
    ]);
  });

  it('http(s) 以外の url と、解釈できない geocode は出さない', () => {
    const odd = [
      lib({ city: '野洲市', formalName: 'A図書館', url: 'javascript:alert(1)', geocode: 'abc' }),
    ];
    const content = buildCityPageContent('滋賀県', '野洲市', odd);
    const [, library] = parseJsonLd(renderJsonLd(content))['@graph'];

    expect(library).not.toHaveProperty('url');
    expect(library).not.toHaveProperty('geo');
  });

  it('都道府県ページ・/library/add は BreadcrumbList だけ', () => {
    const pref = parseJsonLd(renderJsonLd(buildPrefecturePageContent('滋賀県', SHIGA)));
    const index = parseJsonLd(renderJsonLd(buildPrefectureIndexContent()));

    expect(pref['@graph'].map((n) => n['@type'])).toEqual(['BreadcrumbList']);
    expect(index['@graph'].map((n) => n['@type'])).toEqual(['BreadcrumbList']);
  });

  it('</script> を含む値でも script 要素を閉じない', () => {
    const evil = [lib({ city: '野洲市', formalName: '</script><script>alert(1)</script>' })];
    const json = renderJsonLd(buildCityPageContent('滋賀県', '野洲市', evil));

    expect(json).not.toContain('</script>');
    expect(JSON.stringify(JSON.parse(json))).toContain('</script>');
  });
});
