import { describe, expect, test } from 'vitest';

import {
  Library,
  librariesEqual,
  libraryFromJson,
  libraryKey,
  libraryToJson,
} from '@/domain/models/library';

describe('Library', () => {
  test('two libraries with same systemId, libKey, libId are equal', () => {
    const lib1: Library = {
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
    };

    const lib2: Library = {
      systemId: 'Tokyo_Minato',
      systemName: '港区図書館（別名）',
      libKey: 'みなと',
      libId: '123',
      shortName: '別の名前',
      formalName: '別の正式名称',
      address: '別の住所',
      pref: '東京都',
      city: '港区',
      category: 'LARGE',
    };

    expect(librariesEqual(lib1, lib2)).toBe(true);
    expect(libraryKey(lib1)).toBe(libraryKey(lib2));
  });

  describe('JSON serialization', () => {
    const library: Library = {
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
      url: 'https://example.com',
      tel: '03-1234-5678',
      geocode: '139.7454,35.6585',
    };

    test('fromJson creates correct instance', () => {
      const json = {
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
        url: 'https://example.com',
        tel: '03-1234-5678',
        geocode: '139.7454,35.6585',
      };

      const result = libraryFromJson(json);
      expect(result.systemId).toBe('Tokyo_Minato');
      expect(result.systemName).toBe('港区図書館');
      expect(result.libKey).toBe('みなと');
      expect(result.libId).toBe('123');
      expect(result.shortName).toBe('みなと図書館');
      expect(result.formalName).toBe('港区立みなと図書館');
      expect(result.address).toBe('東京都港区芝公園3-2-25');
      expect(result.pref).toBe('東京都');
      expect(result.city).toBe('港区');
      expect(result.category).toBe('MEDIUM');
      expect(result.url).toBe('https://example.com');
      expect(result.tel).toBe('03-1234-5678');
      expect(result.geocode).toBe('139.7454,35.6585');
    });

    test('roundtrip toJson/fromJson preserves data', () => {
      const json = libraryToJson(library);
      const restored = libraryFromJson(json as Record<string, unknown>);
      expect(librariesEqual(restored, library)).toBe(true);
      expect(restored.formalName).toBe(library.formalName);
      expect(restored.address).toBe(library.address);
      expect(restored.url).toBe(library.url);
      expect(restored.tel).toBe(library.tel);
      expect(restored.geocode).toBe(library.geocode);
    });
  });
});
