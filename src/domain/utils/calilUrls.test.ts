import { describe, expect, test } from 'vitest';

import type { Library } from '@/domain/models/library';
import { calilBookUrl, calilLibraryUrl } from '@/domain/utils/calilUrls';

/** テスト用の Library。上書きしたいフィールドだけ渡す。 */
function makeLibrary(overrides: Partial<Library> = {}): Library {
  return {
    systemId: 'Tokyo_Setagaya',
    systemName: '東京都世田谷区',
    libKey: '中央',
    libId: '119570',
    shortName: '中央',
    formalName: '世田谷区立中央図書館',
    address: '東京都世田谷区弦巻3-16-8',
    pref: '東京都',
    city: '世田谷区',
    category: 'MEDIUM',
    ...overrides,
  };
}

describe('calilUrls', () => {
  // 形式は カーリル 図書館API仕様書「カーリルへのリンク」節に準拠する。
  // https://calil.jp/doc/api_ref.html
  describe('calilBookUrl', () => {
    test('978始まりのISBN-13は /book/{ISBN-10} を返す', () => {
      expect(calilBookUrl('9784873117584')).toBe(
        'https://calil.jp/book/4873117585',
      );
    });

    test('ハイフン付きでも /book/{ISBN-10} を返す', () => {
      expect(calilBookUrl('978-4-87311-758-4')).toBe(
        'https://calil.jp/book/4873117585',
      );
    });

    test('ISBN-10 入力はそのまま /book/ で返す', () => {
      expect(calilBookUrl('4873117585')).toBe('https://calil.jp/book/4873117585');
    });

    test('979始まり（ISBN-10 を持たない）は null を返す', () => {
      // カーリルの検索URLは仕様書に記載が無いため、推測でフォールバックしない。
      expect(calilBookUrl('9791032305690')).toBeNull();
    });

    test('不正な ISBN は null を返す', () => {
      expect(calilBookUrl('')).toBeNull();
      expect(calilBookUrl('not-an-isbn')).toBeNull();
      expect(calilBookUrl('1234567890123')).toBeNull();
    });
  });

  describe('calilLibraryUrl', () => {
    test('libId と正式名称から /library/{libid}/{正式名称} を返す', () => {
      expect(calilLibraryUrl(makeLibrary())).toBe(
        `https://calil.jp/library/119570/${encodeURIComponent(
          '世田谷区立中央図書館',
        )}`,
      );
    });

    test('正式名称は URL エンコードされる', () => {
      const url = calilLibraryUrl(
        makeLibrary({ libId: '1', formalName: '市立 A/B図書館' }),
      );
      // 生の空白・スラッシュがパスに混入しないこと。
      expect(url).toBe(
        `https://calil.jp/library/1/${encodeURIComponent('市立 A/B図書館')}`,
      );
      expect(url).not.toContain(' ');
    });

    test('libId が空なら systemId と libKey による形式にフォールバックする', () => {
      expect(calilLibraryUrl(makeLibrary({ libId: '' }))).toBe(
        'https://calil.jp/library/search?s=Tokyo_Setagaya&k=' +
          encodeURIComponent('中央'),
      );
    });

    test('正式名称が空なら systemId と libKey による形式にフォールバックする', () => {
      expect(calilLibraryUrl(makeLibrary({ formalName: '' }))).toBe(
        'https://calil.jp/library/search?s=Tokyo_Setagaya&k=' +
          encodeURIComponent('中央'),
      );
    });

    test('フォールバック時も systemId と libKey は URL エンコードされる', () => {
      const url = calilLibraryUrl(
        makeLibrary({ libId: '', systemId: 'Test_A B', libKey: '本館/別館' }),
      );
      expect(url).toBe(
        `https://calil.jp/library/search?s=${encodeURIComponent(
          'Test_A B',
        )}&k=${encodeURIComponent('本館/別館')}`,
      );
    });
  });
});
