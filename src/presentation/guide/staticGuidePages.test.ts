import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { GUIDE_PAGES, guideHref } from './guidePages';

/**
 * 使い方ガイドの静的ページ（public/guide/*.html、#184）の検証。
 *
 * 静的 HTML は型チェックもビルドも通らないため、検索エンジン向けの必須要素・
 * 内部リンク・CSP・文言の制約をここで機械的に確認する。
 */
const GUIDE_DIR = path.resolve(__dirname, '../../../public/guide');
const SITE = 'https://libcheck.app';
/** アプリにない機能（キーワード・書名での蔵書検索）を連想させる表現。 */
const FORBIDDEN = ['蔵書検索', 'キーワードで検索', '書名で検索', 'タイトルで検索'];

function load(slug: string): Document {
  const html = readFileSync(path.join(GUIDE_DIR, `${slug}.html`), 'utf-8');
  return new DOMParser().parseFromString(html, 'text/html');
}

function rawHtml(slug: string): string {
  return readFileSync(path.join(GUIDE_DIR, `${slug}.html`), 'utf-8');
}

describe('public/guide/*.html', () => {
  it('GUIDE_PAGES と HTML ファイルが一致する', () => {
    const files = readdirSync(GUIDE_DIR)
      .filter((f) => f.endsWith('.html'))
      .map((f) => f.replace(/\.html$/, ''))
      .sort();
    expect(files).toEqual(GUIDE_PAGES.map((g) => g.slug).sort());
  });

  describe.each(GUIDE_PAGES.map((g) => [g.slug, g] as const))('%s', (slug, guide) => {
    it('h1 は GUIDE_PAGES の title と同じで、1つだけ', () => {
      const doc = load(slug);
      expect([...doc.querySelectorAll('h1')].map((h) => h.textContent?.trim())).toEqual([guide.title]);
    });

    it('title・description・canonical（拡張子なし）・OGP を持ち、noindex ではない', () => {
      const doc = load(slug);
      const meta = (selector: string) => doc.querySelector(selector)?.getAttribute('content') ?? '';

      expect(doc.title).toMatch(/ — LibCheck$/);
      expect(meta('meta[name="description"]').length).toBeGreaterThan(40);
      expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE}/guide/${slug}`);
      expect(meta('meta[property="og:url"]')).toBe(`${SITE}/guide/${slug}`);
      expect(meta('meta[property="og:type"]')).toBe('article');
      expect(meta('meta[property="og:title"]')).toBe(doc.title);
      expect(doc.querySelector('meta[name="robots"]')).toBeNull();
      expect(doc.querySelector('meta[name="viewport"]')).not.toBeNull();
      expect(doc.documentElement.lang).toBe('ja');
    });

    it('JSON-LD は BreadcrumbList（トップ > ページ）と Article', () => {
      const doc = load(slug);
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts).toHaveLength(1);
      const ld = JSON.parse(scripts[0].textContent ?? '');
      const graph = ld['@graph'] as Record<string, unknown>[];

      expect(ld['@context']).toBe('https://schema.org');
      expect(graph.map((n) => n['@type'])).toEqual(['BreadcrumbList', 'Article']);
      expect(graph[0].itemListElement).toEqual([
        { '@type': 'ListItem', position: 1, name: 'トップ', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: guide.title },
      ]);
      expect(graph[1]).toMatchObject({
        headline: guide.title,
        mainEntityOfPage: `${SITE}/guide/${slug}`,
      });
      expect(graph[1].datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('パンくず・都道府県一覧への導線・ほかのガイドへのリンク・フッターを持つ', () => {
      const doc = load(slug);
      const nav = doc.querySelector('nav[aria-label="パンくずリスト"]');
      expect(nav?.querySelector('a[href="/"]')?.textContent).toBe('トップ');
      expect(nav?.querySelector('[aria-current="page"]')?.textContent).toBe(guide.title);

      const hrefs = [...doc.querySelectorAll('a')].map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/library/add');
      for (const other of GUIDE_PAGES.filter((g) => g.slug !== slug)) {
        expect(hrefs).toContain(guideHref(other.slug));
      }
      expect(hrefs).not.toContain(guideHref(slug));
      expect(hrefs).toContain('/privacy-policy.html');
      expect(hrefs).toContain('/terms.html');
    });

    it('CSP に反するインラインのスクリプト・イベントハンドラを使わない', () => {
      const doc = load(slug);
      const inlineScripts = [...doc.querySelectorAll('script')].filter(
        (s) => s.getAttribute('type') !== 'application/ld+json',
      );
      expect(inlineScripts).toEqual([]);
      expect(rawHtml(slug)).not.toMatch(/\son[a-z]+=/);
      expect(doc.querySelector('link[rel="stylesheet"]')?.getAttribute('href')).toBe('/guide/guide.css');
    });

    it('アプリにない機能を連想させる表現を使わない', () => {
      const text = load(slug).body.textContent ?? '';
      for (const word of FORBIDDEN) expect(text).not.toContain(word);
    });
  });
});
