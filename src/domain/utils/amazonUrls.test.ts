import { describe, expect, test } from 'vitest';

import { amazonProductUrl, amazonCoverImageUrl } from '@/domain/utils/amazonUrls';

describe('amazonUrls', () => {
  describe('amazonProductUrl', () => {
    test('978始まりのISBN-13は /dp/{ISBN-10} を返す', () => {
      expect(amazonProductUrl('9784873117584')).toBe(
        'https://www.amazon.co.jp/dp/4873117585',
      );
    });

    test('ハイフン付きでも /dp/{ISBN-10} を返す', () => {
      expect(amazonProductUrl('978-4-87311-758-4')).toBe(
        'https://www.amazon.co.jp/dp/4873117585',
      );
    });

    test('ISBN-10 入力はそのまま /dp/ で返す', () => {
      expect(amazonProductUrl('4873117585')).toBe(
        'https://www.amazon.co.jp/dp/4873117585',
      );
    });

    test('979始まり（ISBN-10 を持たない）は検索URLにフォールバックする', () => {
      expect(amazonProductUrl('9791032305690')).toBe(
        'https://www.amazon.co.jp/s?k=9791032305690',
      );
    });

    test('アソシエイトタグを渡すと /dp/ に tag= を付与する', () => {
      expect(amazonProductUrl('9784873117584', 'libcheck-22')).toBe(
        'https://www.amazon.co.jp/dp/4873117585?tag=libcheck-22',
      );
    });

    test('アソシエイトタグを渡すと検索URLにも tag= を付与する', () => {
      expect(amazonProductUrl('9791032305690', 'libcheck-22')).toBe(
        'https://www.amazon.co.jp/s?k=9791032305690&tag=libcheck-22',
      );
    });

    test('空のアソシエイトタグは通常リンクを返す', () => {
      expect(amazonProductUrl('9784873117584', '')).toBe(
        'https://www.amazon.co.jp/dp/4873117585',
      );
      expect(amazonProductUrl('9784873117584', '   ')).toBe(
        'https://www.amazon.co.jp/dp/4873117585',
      );
    });
  });

  describe('amazonCoverImageUrl', () => {
    test('978始まりは Amazon 画像CDN のURLを返す', () => {
      expect(amazonCoverImageUrl('9784873117584')).toBe(
        'https://images-na.ssl-images-amazon.com/images/P/4873117585.09.LZZZZZZZ.jpg',
      );
    });

    test('ISBN-10 入力でも画像URLを返す', () => {
      expect(amazonCoverImageUrl('4873117585')).toBe(
        'https://images-na.ssl-images-amazon.com/images/P/4873117585.09.LZZZZZZZ.jpg',
      );
    });

    test('979始まり（ISBN-10 を持たない）は null を返す', () => {
      expect(amazonCoverImageUrl('9791032305690')).toBeNull();
    });
  });
});
