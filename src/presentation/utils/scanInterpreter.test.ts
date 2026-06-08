import { describe, test, expect } from 'vitest';

import { interpretScannedBarcode } from '@/presentation/utils/scanInterpreter';

describe('interpretScannedBarcode', () => {
  test('有効なISBN-13(978始まり)はisbnとして解釈する', () => {
    expect(interpretScannedBarcode('9784873115658')).toEqual({
      kind: 'isbn',
      isbn: '9784873115658',
    });
  });

  test('979始まりの有効なISBN-13もisbnとして解釈する', () => {
    // 先頭12桁 979412345678 のチェックディジットは 3。
    expect(interpretScannedBarcode('9794123456783')).toEqual({
      kind: 'isbn',
      isbn: '9794123456783',
    });
  });

  test('ハイフン付きでも正規化してisbnとして解釈する', () => {
    expect(interpretScannedBarcode('978-4-87311-565-8')).toEqual({
      kind: 'isbn',
      isbn: '9784873115658',
    });
  });

  test('日本の書籍下段の価格コード(192始まり)はnonIsbnとして扱う', () => {
    expect(interpretScannedBarcode('1921234567897')).toEqual({
      kind: 'nonIsbn',
    });
  });

  test('978始まりでもチェックディジットが不正ならnonIsbn', () => {
    expect(interpretScannedBarcode('9784873115659')).toEqual({
      kind: 'nonIsbn',
    });
  });
});
