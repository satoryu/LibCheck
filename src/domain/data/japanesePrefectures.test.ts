import { describe, expect, test } from 'vitest';

import {
  JAPANESE_PREFECTURE_REGIONS,
  allPrefectures,
} from '@/domain/data/japanesePrefectures';

describe('JapanesePrefectures', () => {
  test('has 7 region groups', () => {
    expect(JAPANESE_PREFECTURE_REGIONS.length).toBe(7);
  });

  test('contains exactly 47 prefectures in total', () => {
    expect(allPrefectures.length).toBe(47);
  });

  test('has no duplicate prefectures', () => {
    const all = allPrefectures;
    expect(new Set(all).size).toBe(all.length);
  });
});
