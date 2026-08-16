import { describe, expect, test } from 'vitest';

import { isPublicPath, PUBLIC_PATHS } from '@/presentation/auth/publicPaths';

describe('publicPaths', () => {
  describe('PUBLIC_PATHS（既定値）', () => {
    test('本Issue（#157）の時点では空である（どのルートも未ログインで公開しない）', () => {
      expect(PUBLIC_PATHS).toEqual([]);
    });
  });

  describe('isPublicPath', () => {
    test('完全一致するパターンがあれば true', () => {
      expect(isPublicPath('/library/add', ['/library/add'])).toBe(true);
    });

    test('一致するパターンが無ければ false', () => {
      expect(isPublicPath('/history', ['/library/add'])).toBe(false);
    });

    test('動的セグメント（:pref）を含むパターンにマッチする', () => {
      const patterns = ['/library/add/:pref'];
      expect(isPublicPath('/library/add/東京都', patterns)).toBe(true);
      expect(isPublicPath('/library/add/大阪府', patterns)).toBe(true);
    });

    test('動的セグメントは1階層のみにマッチし、階層をまたがない', () => {
      const patterns = ['/library/add/:pref'];
      expect(isPublicPath('/library/add/東京都/港区', patterns)).toBe(false);
    });

    test('複数の動的セグメント（:pref/:city）を含むパターンにマッチする', () => {
      const patterns = ['/library/add/:pref/:city'];
      expect(isPublicPath('/library/add/東京都/港区', patterns)).toBe(true);
    });

    test('パスの前方一致だけでは true にならない（セグメント単位で厳密一致）', () => {
      const patterns = ['/library'];
      expect(isPublicPath('/library-management', patterns)).toBe(false);
    });

    test('パターン未指定時は既定の PUBLIC_PATHS（空）を使い、常に false', () => {
      expect(isPublicPath('/library/add')).toBe(false);
      expect(isPublicPath('/')).toBe(false);
    });
  });
});
