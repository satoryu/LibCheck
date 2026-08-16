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

  describe('地域ページ（#158・公開済み）', () => {
    it('/library/add は noindex を持たず、固有タイトルを返す', () => {
      const meta = findRouteMeta('/library/add');
      expect(meta).not.toBeNull();
      expect(meta.noindex).toBe(false);
      expect(meta.title).toContain('LibCheck');
      expect(meta.description).toBeTruthy();
    });

    it('/library/add/:pref は都道府県名をタイトル・説明文に反映する', () => {
      const meta = findRouteMeta('/library/add/東京都');
      expect(meta).not.toBeNull();
      expect(meta.noindex).toBe(false);
      expect(meta.title).toContain('東京都');
      expect(meta.description).toContain('東京都');
    });

    it('URLエンコードされた都道府県名も正しくデコードして反映する', () => {
      const meta = findRouteMeta(`/library/add/${encodeURIComponent('東京都')}`);
      expect(meta.title).toContain('東京都');
    });

    it('/library/add/:pref/:city は都道府県名・市区町村名の両方を反映する', () => {
      const meta = findRouteMeta('/library/add/東京都/港区');
      expect(meta).not.toBeNull();
      expect(meta.noindex).toBe(false);
      expect(meta.title).toContain('東京都');
      expect(meta.title).toContain('港区');
      expect(meta.description).toContain('東京都');
      expect(meta.description).toContain('港区');
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
