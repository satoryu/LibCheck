import { describe, expect, test } from 'vitest';

import {
  JAPANESE_PREFECTURES,
  buildSitemapXml,
  mapCalilLibraryToLibrary,
} from './generateLibraryData.mjs';
import { allPrefectures } from '../src/domain/data/japanesePrefectures.ts';

describe('JAPANESE_PREFECTURES（src/domain/data/japanesePrefectures.ts との同期確認）', () => {
  test('47都道府県すべてを含み、重複が無い', () => {
    expect(JAPANESE_PREFECTURES).toHaveLength(47);
    expect(new Set(JAPANESE_PREFECTURES).size).toBe(47);
  });

  test('src/domain/data/japanesePrefectures.ts の一覧と完全一致する（意図的な複製のドリフト検知）', () => {
    expect(new Set(JAPANESE_PREFECTURES)).toEqual(new Set(allPrefectures));
  });
});

describe('mapCalilLibraryToLibrary', () => {
  test('カーリルの生レスポンス（snake_case）を Library 型（camelCase）に変換する', () => {
    const raw = {
      systemid: 'Tokyo_Minato',
      systemname: '港区図書館',
      libkey: 'みなと',
      libid: '123',
      short: 'みなと図書館',
      formal: '港区立みなと図書館',
      url_pc: 'https://example.com/minato',
      address: '東京都港区芝公園3-2-25',
      pref: '東京都',
      city: '港区',
      post: '105-0011',
      tel: '03-0000-0000',
      geocode: '139.75,35.65',
      category: 'MEDIUM',
    };

    expect(mapCalilLibraryToLibrary(raw)).toEqual({
      systemId: 'Tokyo_Minato',
      systemName: '港区図書館',
      libKey: 'みなと',
      libId: '123',
      shortName: 'みなと図書館',
      formalName: '港区立みなと図書館',
      address: '東京都港区芝公園3-2-25',
      pref: '東京都',
      city: '港区',
      category: 'MEDIUM',
      url: 'https://example.com/minato',
      tel: '03-0000-0000',
      geocode: '139.75,35.65',
    });
  });

  test('任意フィールド（url_pc/tel/geocode）が欠けていても壊れない', () => {
    const raw = {
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
    };

    const result = mapCalilLibraryToLibrary(raw);
    expect(result.url).toBeUndefined();
    expect(result.tel).toBeUndefined();
    expect(result.geocode).toBeUndefined();
  });

  test('文字列でないフィールドは空文字にフォールバックする（libraryResponseFromJson と同じ方針）', () => {
    const raw = { systemid: null, formal: 123 };
    const result = mapCalilLibraryToLibrary(raw);
    expect(result.systemId).toBe('');
    expect(result.formalName).toBe('');
  });
});

describe('buildSitemapXml', () => {
  test('静的パス・都道府県・市区町村ページを含む sitemap XML を生成する', () => {
    const xml = buildSitemapXml({
      baseUrl: 'https://libcheck.app',
      staticPaths: [{ path: '/', changefreq: 'monthly', priority: '1.0' }],
      citiesByPrefecture: {
        東京都: ['港区', '大田区'],
        大阪府: ['大阪市'],
      },
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<loc>https://libcheck.app/</loc>');
    expect(xml).toContain(
      `<loc>https://libcheck.app/library/add/${encodeURIComponent('東京都')}</loc>`,
    );
    expect(xml).toContain(
      `<loc>https://libcheck.app/library/add/${encodeURIComponent('東京都')}/${encodeURIComponent('港区')}</loc>`,
    );
    expect(xml).toContain(
      `<loc>https://libcheck.app/library/add/${encodeURIComponent('大阪府')}/${encodeURIComponent('大阪市')}</loc>`,
    );
  });

  test('都道府県一覧ページ自体（/library/add）も含む', () => {
    const xml = buildSitemapXml({
      baseUrl: 'https://libcheck.app',
      staticPaths: [],
      citiesByPrefecture: { 東京都: ['港区'] },
    });

    expect(xml).toContain('<loc>https://libcheck.app/library/add</loc>');
  });

  test('市区町村が0件の都道府県でも都道府県ページ自体は含む', () => {
    const xml = buildSitemapXml({
      baseUrl: 'https://libcheck.app',
      staticPaths: [],
      citiesByPrefecture: { 鳥取県: [] },
    });

    expect(xml).toContain(
      `<loc>https://libcheck.app/library/add/${encodeURIComponent('鳥取県')}</loc>`,
    );
  });

  test('URL の件数が想定どおり（静的1 + 都道府県一覧1 + 都道府県2 + 市区町村3）', () => {
    const xml = buildSitemapXml({
      baseUrl: 'https://libcheck.app',
      staticPaths: [{ path: '/', changefreq: 'monthly', priority: '1.0' }],
      citiesByPrefecture: {
        東京都: ['港区', '大田区'],
        大阪府: ['大阪市'],
      },
    });

    const count = (xml.match(/<url>/g) ?? []).length;
    expect(count).toBe(1 + 1 + 2 + 3);
  });
});
