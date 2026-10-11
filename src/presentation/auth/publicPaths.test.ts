import { describe, expect, test } from 'vitest';

import { isPublicPath } from '@/presentation/auth/publicPaths';

describe('publicPaths', () => {
  describe('PUBLIC_PATHS（既定値）', () => {
    // #158: 地域ページ（都道府県選択・市区町村選択・図書館一覧）を公開する。
    test('地域ページ3ルートが未ログインで閲覧できる', () => {
      expect(isPublicPath('/library/add')).toBe(true);
      expect(isPublicPath('/library/add/東京都')).toBe(true);
      expect(isPublicPath('/library/add/東京都/港区')).toBe(true);
    });

    test('それ以外の既存ルートは引き続き非公開', () => {
      expect(isPublicPath('/')).toBe(false);
      expect(isPublicPath('/history')).toBe(false);
      expect(isPublicPath('/library')).toBe(false);
      expect(isPublicPath('/scan')).toBe(false);
      expect(isPublicPath('/isbn-input')).toBe(false);
    });

    // #159: 共有された検索結果ページは、未ログインでも書誌情報と案内を表示する。
    test('検索結果ページが未ログインで閲覧できる', () => {
      expect(isPublicPath('/result/9784873117584')).toBe(true);
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

    test('パターン未指定時は既定の PUBLIC_PATHS を使う', () => {
      // #158: /library/add 系は既定で公開。それ以外は非公開のまま。
      expect(isPublicPath('/library/add')).toBe(true);
      expect(isPublicPath('/')).toBe(false);
    });
  });
});
