import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import {
  buildSitemapXml,
  cityPriority,
  parseLastmodArg,
  readLibrariesByPrefecture,
} from './generateSitemap.mjs';

const BASE_URL = 'https://libcheck.app';
const LASTMOD = '2026-10-10';

function libs(city, count) {
  return Array.from({ length: count }, (_, i) => ({ city, formalName: `${city}図書館${i}` }));
}

const enc = encodeURIComponent;

function urlBlock(xml, loc) {
  const start = xml.indexOf(`<loc>${loc}</loc>`);
  if (start < 0) return null;
  return xml.slice(start, xml.indexOf('</url>', start));
}

describe('buildSitemapXml', () => {
  const librariesByPrefecture = {
    東京都: [...libs('港区', 12), ...libs('大田区', 1)],
    大阪府: libs('大阪市', 5),
    鳥取県: [],
  };

  test('トップ・都道府県一覧・都道府県・市区町村ページを lastmod 付きで含む', () => {
    const xml = buildSitemapXml({ baseUrl: BASE_URL, librariesByPrefecture, lastmod: LASTMOD });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    for (const loc of [
      `${BASE_URL}/`,
      `${BASE_URL}/library/add`,
      `${BASE_URL}/library/add/${enc('東京都')}`,
      `${BASE_URL}/library/add/${enc('東京都')}/${enc('港区')}`,
      `${BASE_URL}/library/add/${enc('大阪府')}/${enc('大阪市')}`,
    ]) {
      expect(urlBlock(xml, loc)).toContain(`<lastmod>${LASTMOD}</lastmod>`);
    }
  });

  test('図書館が0館の都道府県は含めない（0館ページは noindex。#182）', () => {
    const xml = buildSitemapXml({ baseUrl: BASE_URL, librariesByPrefecture, lastmod: LASTMOD });

    expect(xml).not.toContain(enc('鳥取県'));
  });

  test('URL の件数（トップ1 + 都道府県一覧1 + 図書館のある都道府県2 + 市区町村3）', () => {
    const xml = buildSitemapXml({ baseUrl: BASE_URL, librariesByPrefecture, lastmod: LASTMOD });

    expect((xml.match(/<url>/g) ?? []).length).toBe(1 + 1 + 2 + 3);
  });

  test('priority: トップ 1.0 / 都道府県一覧 0.8 / 都道府県 0.7 / 市区町村は館数で段階化', () => {
    const xml = buildSitemapXml({ baseUrl: BASE_URL, librariesByPrefecture, lastmod: LASTMOD });

    expect(urlBlock(xml, `${BASE_URL}/`)).toContain('<priority>1.0</priority>');
    expect(urlBlock(xml, `${BASE_URL}/library/add`)).toContain('<priority>0.8</priority>');
    expect(urlBlock(xml, `${BASE_URL}/library/add/${enc('東京都')}`)).toContain('<priority>0.7</priority>');
    expect(urlBlock(xml, `${BASE_URL}/library/add/${enc('東京都')}/${enc('港区')}`)).toContain(
      '<priority>0.6</priority>',
    );
    expect(urlBlock(xml, `${BASE_URL}/library/add/${enc('東京都')}/${enc('大田区')}`)).toContain(
      '<priority>0.3</priority>',
    );
  });

  test('市区町村は名前順（地域ページの一覧と同じ並び）', () => {
    const xml = buildSitemapXml({
      baseUrl: BASE_URL,
      librariesByPrefecture: { 東京都: [...libs('港区', 1), ...libs('大田区', 1)] },
      lastmod: LASTMOD,
    });

    expect(xml.indexOf(enc('大田区'))).toBeLessThan(xml.indexOf(enc('港区')));
  });
});

describe('cityPriority', () => {
  test.each([
    [1, '0.3'],
    [2, '0.4'],
    [4, '0.4'],
    [5, '0.5'],
    [9, '0.5'],
    [10, '0.6'],
    [50, '0.6'],
  ])('%i館 → %s', (count, expected) => {
    expect(cityPriority(count)).toBe(expected);
  });
});

describe('parseLastmodArg', () => {
  test('--lastmod=YYYY-MM-DD を読む', () => {
    expect(parseLastmodArg(['--lastmod=2026-10-10'], new Date('2026-01-01T00:00:00Z'))).toBe('2026-10-10');
  });

  test('指定が無ければ今日の日付', () => {
    expect(parseLastmodArg([], new Date('2026-10-10T03:00:00Z'))).toBe('2026-10-10');
  });

  test('形式が不正なら例外', () => {
    expect(() => parseLastmodArg(['--lastmod=2026/10/10'], new Date())).toThrow();
  });
});

describe('readLibrariesByPrefecture', () => {
  let dir;
  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  test('ディレクトリの {pref}.json を都道府県名 → 図書館配列として読む', async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'libcheck-sitemap-'));
    await writeFile(path.join(dir, '滋賀県.json'), JSON.stringify(libs('野洲市', 2)));
    await writeFile(path.join(dir, 'README.txt'), 'ignore me');

    const result = await readLibrariesByPrefecture(dir);

    expect(Object.keys(result)).toEqual(['滋賀県']);
    expect(result['滋賀県']).toHaveLength(2);
  });
});
