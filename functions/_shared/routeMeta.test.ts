// @vitest-environment node
import { describe, it, expect } from 'vitest';

import { findRouteMeta } from './routeMeta.js';

describe('findRouteMeta', () => {
  it('/ はエントリを持たない（既定メタをそのまま使うため null）', () => {
    expect(findRouteMeta('/')).toBeNull();
  });

  it('未知のパスは null', () => {
    expect(findRouteMeta('/no-such-route')).toBeNull();
  });

  it('階層数が異なるパスにはマッチしない', () => {
    expect(findRouteMeta('/library/add/東京都/港区/extra')).toBeNull();
  });

  it('不正なパーセントエンコーディングは例外にせず null（未知のパス扱い）', () => {
    expect(findRouteMeta('/library/add/%E0%A4%A')).toBeNull();
  });

  describe('地域ページ（#158 で公開、#182 で内容はミドルウェアが組み立てる）', () => {
    it('/library/add は region: index を返す', () => {
      expect(findRouteMeta('/library/add')).toEqual({ region: 'index', params: {} });
    });

    it('/library/add/:pref は region: prefecture と、デコード済みの都道府県名を返す', () => {
      expect(findRouteMeta(`/library/add/${encodeURIComponent('東京都')}`)).toEqual({
        region: 'prefecture',
        params: { pref: '東京都' },
      });
    });

    it('/library/add/:pref/:city は region: city と都道府県名・市区町村名を返す', () => {
      expect(findRouteMeta('/library/add/東京都/港区')).toEqual({
        region: 'city',
        params: { pref: '東京都', city: '港区' },
      });
    });
  });

  describe('使い方ガイド（#184・静的ページ）', () => {
    it('/guide/:slug は static を返す（ミドルウェアは手を加えない）', () => {
      expect(findRouteMeta('/guide/bookstore')).toEqual({ static: true });
    });

    it('/guide/:slug.html（本番では 308 で転送される前のパス）も static', () => {
      expect(findRouteMeta('/guide/bookstore.html')).toEqual({ static: true });
    });
  });

  describe('個人向けページ（引き続き非公開）', () => {
    it('/history は noindex のまま', () => {
      const meta = findRouteMeta('/history');
      expect(meta.noindex).toBe(true);
    });

    it('/result/:isbn は noindex のまま', () => {
      const meta = findRouteMeta('/result/9784873117584');
      expect(meta.noindex).toBe(true);
    });

    it('/library（登録図書館の管理）は noindex のまま', () => {
      const meta = findRouteMeta('/library');
      expect(meta.noindex).toBe(true);
    });
  });
});
