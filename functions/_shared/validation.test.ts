// @vitest-environment node
import { describe, it, expect } from 'vitest';

import {
  LIMITS,
  tooLarge,
  validateLibraries,
  validateHistory,
} from './validation.js';

const lib = { systemId: 'Sys1', libKey: 'k1', libId: 'i1', formalName: 'A' };
const entry = {
  isbn: '9784873117584',
  searchedAt: '2026-01-01T00:00:00.000Z',
  libraryStatuses: { みなと: 'available' },
};

describe('tooLarge', () => {
  it('上限以下は false', () => {
    expect(tooLarge('x'.repeat(100))).toBe(false);
  });
  it('上限超過は true', () => {
    expect(tooLarge('x'.repeat(LIMITS.maxBodyBytes + 1))).toBe(true);
  });
});

describe('validateLibraries', () => {
  it('正常系は ok と value を返す', () => {
    const r = validateLibraries({ libraries: [lib] });
    expect(r).toEqual({ ok: true, value: [lib] });
  });
  it('libraries が配列でなければ 400', () => {
    expect(validateLibraries({ nope: true })).toEqual({
      ok: false,
      status: 400,
      error: 'bad request',
    });
  });
  it('配列長が上限超過なら 413', () => {
    const many = Array.from({ length: LIMITS.maxItems + 1 }, () => lib);
    expect(validateLibraries({ libraries: many }).status).toBe(413);
  });
  it('必須フィールド欠落の要素は 400', () => {
    const r = validateLibraries({ libraries: [{ systemId: 'Sys1', libKey: 'k1' }] });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });
  it('文字列以外の systemId は 400', () => {
    expect(validateLibraries({ libraries: [{ ...lib, systemId: 123 }] }).status).toBe(400);
  });
  it('空文字の libId は 400', () => {
    expect(validateLibraries({ libraries: [{ ...lib, libId: '' }] }).status).toBe(400);
  });
});

describe('validateHistory', () => {
  it('正常系は ok と value を返す', () => {
    const r = validateHistory({ entries: [entry] });
    expect(r).toEqual({ ok: true, value: [entry] });
  });
  it('entries が配列でなければ 400', () => {
    expect(validateHistory({ nope: true }).status).toBe(400);
  });
  it('配列長が上限超過なら 413', () => {
    const many = Array.from({ length: LIMITS.maxItems + 1 }, () => entry);
    expect(validateHistory({ entries: many }).status).toBe(413);
  });
  it('isbn 欠落は 400', () => {
    expect(validateHistory({ entries: [{ searchedAt: entry.searchedAt }] }).status).toBe(400);
  });
  it('libraryStatuses が非オブジェクトなら 400', () => {
    expect(
      validateHistory({ entries: [{ ...entry, libraryStatuses: 'x' }] }).status,
    ).toBe(400);
  });
  it('libraryStatuses 省略は許容', () => {
    const r = validateHistory({
      entries: [{ isbn: entry.isbn, searchedAt: entry.searchedAt }],
    });
    expect(r.ok).toBe(true);
  });
});
