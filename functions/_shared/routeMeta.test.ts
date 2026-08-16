// @vitest-environment node
import { describe, it, expect } from 'vitest';

import { findRouteMeta } from './routeMeta.js';

describe('findRouteMeta', () => {
  it('既知の静的パスは完全一致でメタ情報を返す', () => {
    const meta = findRouteMeta('/history');
    expect(meta).not.toBeNull();
    expect(meta.title).toContain('LibCheck');
    expect(meta.noindex).toBe(true);
  });

  it('動的セグメント（:pref）を含むパターンにマッチする', () => {
    const meta = findRouteMeta('/library/add/東京都');
    expect(meta).not.toBeNull();
    expect(meta.noindex).toBe(true);
  });

  it('動的セグメント（:pref/:city）を含むパターンにマッチする', () => {
    const meta = findRouteMeta('/library/add/東京都/港区');
    expect(meta).not.toBeNull();
    expect(meta.noindex).toBe(true);
  });

  it('動的セグメント（:isbn）を含むパターンにマッチする', () => {
    const meta = findRouteMeta('/result/9784873117584');
    expect(meta).not.toBeNull();
    expect(meta.noindex).toBe(true);
  });

  it('/ はエントリを持たない（既定メタをそのまま使うため null）', () => {
    expect(findRouteMeta('/')).toBeNull();
  });

  it('未知のパスは null', () => {
    expect(findRouteMeta('/no-such-route')).toBeNull();
  });

  it('階層数が異なるパスにはマッチしない', () => {
    // '/library/add/:pref' は1階層のみ。2階層のパスにはマッチしない。
    expect(findRouteMeta('/library/add/東京都/港区/extra')).toBeNull();
  });
});
