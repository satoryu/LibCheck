import { describe, expect, test } from 'vitest';

import { isbnValidator } from '@/domain/utils/isbnValidator';

describe('IsbnValidator', () => {
  describe('isValidIsbn13', () => {
    test('有効なISBN-13を受け入れる（978プレフィックス）', () => {
      expect(isbnValidator.isValidIsbn13('9784873117584')).toBe(true);
    });

    test('有効なISBN-13を受け入れる（979プレフィックス）', () => {
      expect(isbnValidator.isValidIsbn13('9791032305690')).toBe(true);
    });

    test('ハイフン付きISBN-13を受け入れる', () => {
      expect(isbnValidator.isValidIsbn13('978-4-87311-758-4')).toBe(true);
    });

    test('チェックディジットが不正なISBN-13を拒否する', () => {
      expect(isbnValidator.isValidIsbn13('9784873117585')).toBe(false);
    });

    test('978/979以外のプレフィックスを拒否する', () => {
      expect(isbnValidator.isValidIsbn13('9774873117584')).toBe(false);
    });
  });

  describe('isValidIsbn10', () => {
    test('有効なISBN-10を受け入れる', () => {
      expect(isbnValidator.isValidIsbn10('4873117585')).toBe(true);
    });

    test('チェックディジットがXのISBN-10を受け入れる', () => {
      expect(isbnValidator.isValidIsbn10('0306406152')).toBe(true);
    });

    test('チェックディジットが不正なISBN-10を拒否する', () => {
      expect(isbnValidator.isValidIsbn10('4873117586')).toBe(false);
    });

    test('チェックディジットが大文字XのISBN-10を受け入れる', () => {
      expect(isbnValidator.isValidIsbn10('080442957X')).toBe(true);
    });

    test('チェックディジットが小文字xのISBN-10を受け入れる', () => {
      expect(isbnValidator.isValidIsbn10('080442957x')).toBe(true);
    });
  });

  describe('isValidIsbn', () => {
    test('小文字xを含むISBN-10を有効と判定する', () => {
      expect(isbnValidator.isValidIsbn('080442957x')).toBe(true);
    });
  });

  describe('normalizeIsbn', () => {
    test('空文字列はそのまま返す', () => {
      expect(isbnValidator.normalizeIsbn('')).toBe('');
    });

    test('小文字xを大文字Xに正規化する', () => {
      expect(isbnValidator.normalizeIsbn('080442957x')).toBe('080442957X');
    });
  });

  describe('getValidationMessage', () => {
    test('小文字xを含む有効なISBN-10はエラーなし', () => {
      expect(isbnValidator.getValidationMessage('080442957x')).toBeNull();
    });

    test('空文字列の場合はnullを返す', () => {
      expect(isbnValidator.getValidationMessage('')).toBeNull();
    });

    test('入力途中（10桁未満）の場合はnullを返す', () => {
      expect(isbnValidator.getValidationMessage('978410')).toBeNull();
    });

    test('ISBN-10のチェックディジットが不正な場合はエラーメッセージを返す', () => {
      expect(isbnValidator.getValidationMessage('4873117586')).toBe(
        'ISBN-10 のチェックディジットが正しくありません',
      );
    });

    test('ISBN-13のチェックディジットが不正な場合はエラーメッセージを返す', () => {
      expect(isbnValidator.getValidationMessage('9784873117585')).toBe(
        'ISBN-13 のチェックディジットが正しくありません',
      );
    });

    test('ISBN-13のプレフィックスが不正な場合はエラーメッセージを返す', () => {
      expect(isbnValidator.getValidationMessage('1234567890123')).toBe(
        'ISBN-13 は 978 または 979 で始まる必要があります',
      );
    });

    test('11桁の場合は桁数エラーメッセージを返す', () => {
      expect(isbnValidator.getValidationMessage('12345678901')).toBe(
        'ISBNは10桁または13桁で入力してください',
      );
    });
  });

  describe('isbn13to10', () => {
    test('978始まりのISBN-13をISBN-10へ変換する', () => {
      expect(isbnValidator.isbn13to10('9784873117584')).toBe('4873117585');
    });

    test('チェックディジットがXになるISBN-13を変換する', () => {
      // ISBN-13 9780804429573 -> ISBN-10 080442957X
      expect(isbnValidator.isbn13to10('9780804429573')).toBe('080442957X');
    });

    test('ハイフン付きISBN-13も変換できる', () => {
      expect(isbnValidator.isbn13to10('978-4-87311-758-4')).toBe('4873117585');
    });

    test('既にISBN-10ならそのまま正規化して返す', () => {
      expect(isbnValidator.isbn13to10('4-87311-758-5')).toBe('4873117585');
      expect(isbnValidator.isbn13to10('080442957x')).toBe('080442957X');
    });

    test('979始まりのISBN-13はISBN-10を持たないためnullを返す', () => {
      expect(isbnValidator.isbn13to10('9791032305690')).toBeNull();
    });

    test('不正な入力はnullを返す', () => {
      expect(isbnValidator.isbn13to10('')).toBeNull();
      expect(isbnValidator.isbn13to10('12345')).toBeNull();
      expect(isbnValidator.isbn13to10('978487311758A')).toBeNull();
    });
  });
});
