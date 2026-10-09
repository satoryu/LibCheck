import { describe, expect, test } from 'vitest';

import {
  JAPANESE_PREFECTURES,
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
